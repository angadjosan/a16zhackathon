import { ImageAnnotatorClient } from '@google-cloud/vision';
import { z } from 'zod';
import {
  OCRResult,
  OCRResultSchema,
  OCRWord,
  BoundingBox,
  GoogleVisionError
} from '@/types/document.types';

// Initialize Google Vision client
let visionClient: ImageAnnotatorClient | null = null;

function getVisionClient(): ImageAnnotatorClient {
  if (!visionClient) {
    // Initialize with API key or service account
    const config: any = {};
    
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use service account file
      config.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    } else if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      // Use API key (for development)
      config.credentials = {
        type: 'service_account',
        project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
        private_key_id: '',
        private_key: '',
        client_email: '',
        client_id: '',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: '',
      };
    }

    if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
      config.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    }

    visionClient = new ImageAnnotatorClient(config);
  }

  return visionClient;
}

/**
 * Convert Google Vision bounding box format to our standard format
 * @param vertices - Google Vision vertices format
 * @returns BoundingBox
 */
function convertBoundingBox(vertices: any[]): BoundingBox {
  if (!vertices || vertices.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  // Find min/max coordinates
  const xs = vertices.map(v => v.x || 0);
  const ys = vertices.map(v => v.y || 0);
  
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Extract text using Google Cloud Vision API with word-level bounding boxes
 * @param imageBuffer - Image buffer
 * @returns Promise<OCRResult>
 */
export async function extractTextWithGoogleVision(
  imageBuffer: Buffer
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    const client = getVisionClient();

    // Perform text detection with detailed features
    const [result] = await client.documentTextDetection({
      image: {
        content: imageBuffer,
      },
      features: [
        {
          type: 'DOCUMENT_TEXT_DETECTION',
          maxResults: 1,
        },
      ],
    });

    const fullTextAnnotations = result.fullTextAnnotation;
    const textAnnotations = result.textAnnotations;

    if (!fullTextAnnotations && !textAnnotations) {
      throw new GoogleVisionError('No text detected in the image');
    }

    // Extract full text
    const fullText = fullTextAnnotations?.text || '';

    // Extract word-level information
    const words: OCRWord[] = [];

    if (fullTextAnnotations?.pages) {
      // Use detailed page structure for better word extraction
      for (const page of fullTextAnnotations.pages) {
        if (page.blocks) {
          for (const block of page.blocks) {
            if (block.paragraphs) {
              for (const paragraph of block.paragraphs) {
                if (paragraph.words) {
                  for (const word of paragraph.words) {
                    if (word.symbols && word.boundingBox?.vertices) {
                      // Combine symbols to form word text
                      const wordText = word.symbols
                        .map(symbol => symbol.text || '')
                        .join('');

                      // Calculate word confidence (average of symbol confidences)
                      const symbolConfidences = word.symbols
                        .map(symbol => symbol.confidence || 0)
                        .filter(conf => conf > 0);
                      
                      const confidence = symbolConfidences.length > 0
                        ? symbolConfidences.reduce((sum, conf) => sum + conf, 0) / symbolConfidences.length
                        : 0.5; // Default confidence if not available

                      // Convert bounding box
                      const boundingBox = convertBoundingBox(word.boundingBox.vertices);

                      words.push({
                        text: wordText,
                        confidence,
                        boundingBox,
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Fallback: use basic text annotations if detailed extraction failed
    if (words.length === 0 && textAnnotations) {
      for (let i = 1; i < textAnnotations.length; i++) { // Skip first element (full text)
        const annotation = textAnnotations[i];
        if (annotation.description && annotation.boundingPoly?.vertices) {
          const boundingBox = convertBoundingBox(annotation.boundingPoly.vertices);
          
          words.push({
            text: annotation.description,
            confidence: 0.8, // Default confidence for basic annotations
            boundingBox,
          });
        }
      }
    }

    const processingTime = Date.now() - startTime;

    const result_obj: OCRResult = {
      fullText,
      words,
      processingTime,
    };

    // Validate result
    return OCRResultSchema.parse(result_obj);

  } catch (error) {
    if (error instanceof GoogleVisionError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new GoogleVisionError(
        'OCR result validation failed',
        { zodError: error.issues }
      );
    }

    // Handle Google Vision API errors
    if (error instanceof Error) {
      throw new GoogleVisionError(
        `Google Vision API call failed: ${error.message}`,
        { originalError: error }
      );
    }

    throw new GoogleVisionError('Unknown error occurred during OCR processing');
  }
}

/**
 * Test Google Vision API connection
 * @returns Promise<boolean>
 */
export async function testGoogleVisionConnection(): Promise<boolean> {
  try {
    const client = getVisionClient();
    
    // Create a simple test image (1x1 white pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xCD, 0xB0, 0x3E, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const [result] = await client.textDetection({
      image: { content: testImageBuffer }
    });

    // If we get here without throwing, the connection works
    return true;
  } catch (error) {
    console.error('Google Vision connection test failed:', error);
    return false;
  }
}

/**
 * Get OCR statistics for debugging
 * @param ocrResult - OCR result to analyze
 * @returns Statistics object
 */
export function getOCRStatistics(ocrResult: OCRResult) {
  const wordCount = ocrResult.words.length;
  const averageConfidence = wordCount > 0 
    ? ocrResult.words.reduce((sum, word) => sum + word.confidence, 0) / wordCount 
    : 0;
  
  const confidenceDistribution = {
    high: ocrResult.words.filter(w => w.confidence >= 0.9).length,
    medium: ocrResult.words.filter(w => w.confidence >= 0.7 && w.confidence < 0.9).length,
    low: ocrResult.words.filter(w => w.confidence < 0.7).length,
  };

  return {
    wordCount,
    averageConfidence,
    confidenceDistribution,
    processingTime: ocrResult.processingTime,
    textLength: ocrResult.fullText.length,
  };
}

/**
 * Clean and preprocess text for better matching
 * @param text - Raw OCR text
 * @returns Cleaned text
 */
export function cleanOCRText(text: string): string {
  return text
    .replace(/[^\w\s\$\.\,\-\(\)\/]/g, '') // Keep alphanumeric, spaces, and common punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}