/**
 * Claude Vision API Integration for Document Extraction
 * 
 * Uses Claude Sonnet 4.5 with vision to extract structured data
 * from document images with confidence scoring
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  DocumentExtraction,
  validateExtraction,
  getExtractionPrompt,
} from '../types/extraction.types';

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Detect image format from buffer
 */
function detectImageFormat(buffer: Buffer): string {
  // Check for common image format signatures
  if (buffer.length < 4) {
    return 'image/jpeg'; // Default fallback
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }

  // WebP: 52 49 46 46 (RIFF) followed by WEBP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    if (buffer.length >= 12 && 
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return 'image/webp';
    }
  }

  // Default to JPEG if format is not recognized
  console.warn('[Claude] Unknown image format, defaulting to JPEG');
  return 'image/jpeg';
}

export interface ClaudeExtractionOptions {
  documentType?: 'receipt' | 'invoice' | 'contract';
  maxTokens?: number;
  temperature?: number;
}

export interface ClaudeExtractionResult {
  extraction: DocumentExtraction;
  rawResponse: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Extract structured data from document image using Claude
 * 
 * @param imageBuffer - Image buffer of the document
 * @param options - Extraction options
 * @returns Structured extraction with confidence scores
 */
export async function extractWithClaude(
  imageBuffer: Buffer,
  options: ClaudeExtractionOptions = {}
): Promise<ClaudeExtractionResult> {
  const {
    documentType = 'receipt', // Default to receipt
    maxTokens = 4096,
    temperature = 0.0, // Use 0 for deterministic outputs
  } = options;

  console.log(`[Claude] Starting extraction for document type: ${documentType}`);

  // Convert buffer to base64
  const base64Image = imageBuffer.toString('base64');

  // Detect image format from buffer
  const mediaType = detectImageFormat(imageBuffer);

  // Get appropriate prompt for document type
  const prompt = getExtractionPrompt(documentType);

  try {
    // Call Claude API with vision
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    console.log(`[Claude] Received response with ${message.usage.input_tokens} input tokens, ${message.usage.output_tokens} output tokens`);

    // Extract text from response
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    const rawResponse = textContent.text;
    console.log(`[Claude] Raw response: ${rawResponse.substring(0, 200)}...`);

    // Parse JSON from response
    let extractionData: unknown;
    try {
      // Claude might wrap JSON in markdown code blocks, so try to extract it
      const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                       rawResponse.match(/```\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch) {
        extractionData = JSON.parse(jsonMatch[1]);
      } else {
        extractionData = JSON.parse(rawResponse);
      }
    } catch (parseError) {
      console.error('[Claude] Failed to parse JSON:', parseError);
      throw new Error(`Failed to parse Claude response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Validate against schema
    const extraction = validateExtraction(extractionData);

    console.log(`[Claude] Successfully extracted ${extraction.fields.length} fields`);

    return {
      extraction,
      rawResponse,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error('[Claude] Extraction failed:', error);
    throw new Error(`Claude extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Auto-detect document type and extract
 * Uses a preliminary Claude call to classify the document
 * 
 * @param imageBuffer - Image buffer of the document
 * @returns Extraction result with auto-detected type
 */
export async function autoExtract(imageBuffer: Buffer): Promise<ClaudeExtractionResult> {
  console.log('[Claude] Auto-detecting document type...');

  // Convert buffer to base64
  const base64Image = imageBuffer.toString('base64');

  // Detect image format from buffer
  const mediaType = detectImageFormat(imageBuffer);

  try {
    // First, classify the document
    const classificationMessage = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      temperature: 0.0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: 'Classify this document as one of: receipt, invoice, or contract. Respond with ONLY the single word.',
            },
          ],
        },
      ],
    });

    const classificationText = classificationMessage.content.find((block) => block.type === 'text');
    if (!classificationText || classificationText.type !== 'text') {
      throw new Error('No text content in classification response');
    }

    const detectedType = classificationText.text.toLowerCase().trim() as 'receipt' | 'invoice' | 'contract';
    console.log(`[Claude] Detected document type: ${detectedType}`);

    // Validate detected type
    if (!['receipt', 'invoice', 'contract'].includes(detectedType)) {
      throw new Error(`Invalid document type detected: ${detectedType}`);
    }

    // Now extract with the detected type
    return await extractWithClaude(imageBuffer, { documentType: detectedType });
  } catch (error) {
    console.error('[Claude] Auto-detection failed:', error);
    // Fallback to receipt extraction
    console.log('[Claude] Falling back to receipt extraction');
    return await extractWithClaude(imageBuffer, { documentType: 'receipt' });
  }
}

/**
 * Test Claude extraction with a sample prompt
 * Useful for debugging
 */
export async function testClaudeConnection(): Promise<boolean> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Reply with: "Claude API connection successful"',
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    console.log('[Claude] Test response:', textContent && textContent.type === 'text' ? textContent.text : 'No response');
    return true;
  } catch (error) {
    console.error('[Claude] Connection test failed:', error);
    return false;
  }
}
