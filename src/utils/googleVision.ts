import { ImageAnnotatorClient } from '@google-cloud/vision';

// Initialize Google Vision client
const vision = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

/**
 * Represents a word detected by OCR with its bounding box and confidence
 */
export interface OCRWord {
  text: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

/**
 * Represents the complete OCR result for a document
 */
export interface OCRResult {
  fullText: string;
  words: OCRWord[];
  pageCount: number;
  processingTime: number;
}

/**
 * Extracts text and bounding boxes from document image using Google Cloud Vision
 * @param {Buffer} imageBuffer - The document image buffer
 * @returns {Promise<OCRResult>} OCR results with text and bounding boxes
 */
export async function extractTextWithBoundingBoxes(imageBuffer: Buffer): Promise<OCRResult> {
  const startTime = Date.now();
  
  try {
    // Prepare the request for Vision API
    const request = {
      image: {
        content: imageBuffer.toString('base64'),
      },
    };

    // Perform text detection with word-level details
    const [result] = await vision.documentTextDetection(request);
    
    if (!result.fullTextAnnotation) {
      throw new Error('No text found in document');
    }

    // Extract full text
    const fullText = result.fullTextAnnotation.text || '';
    
    // Extract word-level details with bounding boxes
    const words = extractWordsWithBoundingBoxes(result);
    
    const processingTime = Date.now() - startTime;
    const pageCount = result.fullTextAnnotation.pages?.length || 1;

    return {
      fullText: fullText.trim(),
      words,
      pageCount,
      processingTime,
    };

  } catch (error) {
    console.error('Google Vision OCR Error:', error);
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts words with bounding boxes from Vision API response
 * @param {any} result - Raw Vision API response
 * @returns {OCRWord[]} Array of words with bounding boxes
 */
function extractWordsWithBoundingBoxes(result: any): OCRWord[] {
  const words: OCRWord[] = [];
  
  if (!result.fullTextAnnotation?.pages) {
    return words;
  }

  // Iterate through pages, blocks, paragraphs, and words
  for (const page of result.fullTextAnnotation.pages) {
    if (!page.blocks) continue;
    
    for (const block of page.blocks) {
      if (!block.paragraphs) continue;
      
      for (const paragraph of block.paragraphs) {
        if (!paragraph.words) continue;
        
        for (const word of paragraph.words) {
          try {
            const text = extractWordText(word);
            const boundingBox = extractBoundingBox(word.boundingBox);
            const confidence = extractConfidence(word);
            
            if (text && boundingBox) {
              words.push({
                text,
                boundingBox,
                confidence,
              });
            }
          } catch (error) {
            console.warn('Failed to process word:', error);
            // Continue processing other words
          }
        }
      }
    }
  }

  return words;
}

/**
 * Extracts text content from a word object
 * @param {any} word - Vision API word object
 * @returns {string} The word text
 */
function extractWordText(word: any): string {
  if (!word.symbols) return '';
  
  return word.symbols
    .map((symbol: any) => symbol.text || '')
    .join('')
    .trim();
}

/**
 * Extracts and normalizes bounding box coordinates
 * @param {any} boundingBox - Vision API bounding box object
 * @returns {object|null} Normalized bounding box or null if invalid
 */
function extractBoundingBox(boundingBox: any): { x: number; y: number; width: number; height: number; } | null {
  if (!boundingBox?.vertices || boundingBox.vertices.length < 4) {
    return null;
  }

  const vertices = boundingBox.vertices;
  
  // Get min/max coordinates from all vertices
  const xCoords = vertices.map((v: any) => v.x || 0);
  const yCoords = vertices.map((v: any) => v.y || 0);
  
  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Extracts confidence score from word object
 * @param {any} word - Vision API word object
 * @returns {number} Confidence score (0.0 to 1.0)
 */
function extractConfidence(word: any): number {
  // Google Vision doesn't provide word-level confidence directly
  // We'll use a heuristic based on symbol confidence if available
  if (!word.symbols) return 0.8; // Default confidence
  
  const symbolConfidences = word.symbols
    .map((symbol: any) => symbol.confidence || 0.8)
    .filter((conf: number) => conf > 0);
  
  if (symbolConfidences.length === 0) return 0.8;
  
  // Return average confidence, clamped between 0 and 1
  const avgConfidence = symbolConfidences.reduce((sum: number, conf: number) => sum + conf, 0) / symbolConfidences.length;
  return Math.min(Math.max(avgConfidence, 0), 1);
}

/**
 * Processes multi-page documents
 * @param {Buffer[]} imageBuffers - Array of image buffers for each page
 * @returns {Promise<OCRResult>} Combined OCR results from all pages
 */
export async function extractTextFromMultiplePages(imageBuffers: Buffer[]): Promise<OCRResult> {
  const startTime = Date.now();
  
  try {
    // Process all pages concurrently
    const pageResults = await Promise.all(
      imageBuffers.map(buffer => extractTextWithBoundingBoxes(buffer))
    );
    
    // Combine results from all pages
    const combinedResult: OCRResult = {
      fullText: pageResults.map(result => result.fullText).join('\n\n'),
      words: [],
      pageCount: pageResults.length,
      processingTime: Date.now() - startTime,
    };
    
    // Adjust bounding boxes for multi-page documents
    let pageOffset = 0;
    for (const pageResult of pageResults) {
      const adjustedWords = pageResult.words.map(word => ({
        ...word,
        boundingBox: {
          ...word.boundingBox,
          y: word.boundingBox.y + pageOffset, // Offset Y coordinates for page stacking
        },
      }));
      
      combinedResult.words.push(...adjustedWords);
      
      // Estimate page height for next page offset (use max Y + height from this page)
      const maxY = Math.max(...pageResult.words.map(w => w.boundingBox.y + w.boundingBox.height));
      pageOffset += maxY + 50; // Add some padding between pages
    }
    
    return combinedResult;
    
  } catch (error) {
    console.error('Multi-page OCR Error:', error);
    throw new Error(`Multi-page OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Filters OCR words by confidence threshold
 * @param {OCRWord[]} words - Array of OCR words
 * @param {number} minConfidence - Minimum confidence threshold (0.0 to 1.0)
 * @returns {OCRWord[]} Filtered words above confidence threshold
 */
export function filterWordsByConfidence(words: OCRWord[], minConfidence: number = 0.5): OCRWord[] {
  return words.filter(word => word.confidence >= minConfidence);
}

/**
 * Searches for words within a specific region of the document
 * @param {OCRWord[]} words - Array of OCR words
 * @param {object} region - Region coordinates {x, y, width, height}
 * @returns {OCRWord[]} Words found within the specified region
 */
export function getWordsInRegion(
  words: OCRWord[], 
  region: { x: number; y: number; width: number; height: number }
): OCRWord[] {
  return words.filter(word => {
    const wordBox = word.boundingBox;
    
    // Check if word bounding box intersects with region
    return (
      wordBox.x < region.x + region.width &&
      wordBox.x + wordBox.width > region.x &&
      wordBox.y < region.y + region.height &&
      wordBox.y + wordBox.height > region.y
    );
  });
}

/**
 * Validates OCR result quality
 * @param {OCRResult} ocrResult - OCR result to validate
 * @returns {object} Validation results with quality metrics
 */
export function validateOCRQuality(ocrResult: OCRResult): {
  isValid: boolean;
  wordCount: number;
  avgConfidence: number;
  lowConfidenceWords: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Calculate metrics
  const wordCount = ocrResult.words.length;
  const avgConfidence = wordCount > 0 
    ? ocrResult.words.reduce((sum, word) => sum + word.confidence, 0) / wordCount 
    : 0;
  
  const lowConfidenceWords = ocrResult.words.filter(word => word.confidence < 0.6).length;
  
  // Add warnings
  if (wordCount < 5) {
    warnings.push('Very few words detected - image may be unclear or empty');
  }
  
  if (avgConfidence < 0.7) {
    warnings.push('Low average confidence - image quality may be poor');
  }
  
  if (lowConfidenceWords > wordCount * 0.3) {
    warnings.push('High number of low-confidence words detected');
  }
  
  if (ocrResult.fullText.length < 20) {
    warnings.push('Very little text extracted - document may be image-based or corrupted');
  }
  
  const isValid = wordCount >= 5 && avgConfidence >= 0.6;
  
  return {
    isValid,
    wordCount,
    avgConfidence,
    lowConfidenceWords,
    warnings,
  };
}