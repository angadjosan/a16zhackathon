import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  ClaudeExtraction,
  ClaudeExtractionSchema,
  DocumentType,
  ExtractedField,
  ClaudeAPIError
} from '@/types/document.types';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Schema for Claude's expected response format
const ClaudeResponseSchema = z.object({
  documentType: z.enum(["receipt", "invoice", "contract", "tax_form", "other"]),
  fields: z.array(z.object({
    name: z.string(),
    value: z.unknown(),
    sourceText: z.string(),
    confidence: z.number().min(0).max(1),
  })),
});

/**
 * Extract structured data from document image using Claude Vision API
 * @param imageBuffer - Image buffer of the document
 * @param mimeType - MIME type of the image (e.g., 'image/jpeg')
 * @returns Promise<ClaudeExtraction>
 */
export async function extractWithClaude(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<ClaudeExtraction> {
  const startTime = Date.now();

  try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');

    // Define the extraction prompt
    const extractionPrompt = `You are analyzing a business document. Please:

1. Identify the document type (receipt, invoice, contract, tax_form, or other)
2. Extract key structured data fields in the specified JSON format
3. For each field, provide the exact source text snippet from the document
4. Assign a confidence score (0.0-1.0) based on text clarity and certainty
5. Focus on these common fields when present:
   - vendor/business_name
   - date/transaction_date
   - total_amount/amount
   - tax_amount
   - line_items (if applicable)
   - address
   - phone
   - email
   - invoice_number/receipt_number

Return ONLY a valid JSON object in this exact format:
{
  "documentType": "receipt|invoice|contract|tax_form|other",
  "fields": [
    {
      "name": "field_name",
      "value": "extracted_value",
      "sourceText": "exact text from document that this value came from",
      "confidence": 0.95
    }
  ]
}

Guidelines:
- Use consistent field names (snake_case)
- Include confidence scores between 0.0-1.0
- sourceText should be the exact text snippet from the document
- Only extract fields that are clearly visible and readable
- Assign higher confidence (>0.9) for clear, unambiguous text
- Assign medium confidence (0.7-0.9) for slightly unclear text
- Assign low confidence (<0.7) for unclear, partially obscured, or ambiguous text`;

    // Make API call to Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.1, // Low temperature for consistent extraction
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as any,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: extractionPrompt,
            },
          ],
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content
      .filter(content => content.type === 'text')
      .map(content => (content as any).text)
      .join('');

    // Parse JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : textContent;
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      throw new ClaudeAPIError(
        'Failed to parse Claude response as JSON',
        { response: textContent, parseError: parseError }
      );
    }

    // Validate response format
    const validatedResponse = ClaudeResponseSchema.parse(parsedResponse);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Calculate overall confidence (average of field confidences)
    const totalConfidence = validatedResponse.fields.length > 0
      ? validatedResponse.fields.reduce((sum, field) => sum + field.confidence, 0) / validatedResponse.fields.length
      : 0;

    // Return structured result
    const result: ClaudeExtraction = {
      documentType: validatedResponse.documentType,
      fields: validatedResponse.fields.map(field => ({
        name: field.name,
        value: field.value,
        sourceText: field.sourceText,
        confidence: field.confidence,
      })),
      processingTime,
      totalConfidence,
    };

    // Validate final result
    return ClaudeExtractionSchema.parse(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ClaudeAPIError(
        'Claude response validation failed',
        { zodError: error.issues }
      );
    }
    
    if (error instanceof ClaudeAPIError) {
      throw error;
    }

    // Handle Anthropic API errors
    if (error instanceof Error) {
      throw new ClaudeAPIError(
        `Claude API call failed: ${error.message}`,
        { originalError: error }
      );
    }

    throw new ClaudeAPIError('Unknown error occurred during Claude extraction');
  }
}

/**
 * Test Claude integration with a simple text prompt
 * @returns Promise<boolean>
 */
export async function testClaudeConnection(): Promise<boolean> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Respond with just "OK" if you can see this message.',
        },
      ],
    });

    const textContent = response.content
      .filter(content => content.type === 'text')
      .map(content => (content as any).text)
      .join('');

    return textContent.trim().toLowerCase().includes('ok');
  } catch (error) {
    console.error('Claude connection test failed:', error);
    return false;
  }
}

/**
 * Get available Claude models (for debugging/info)
 */
export function getClaudeModelInfo() {
  return {
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4000,
    description: 'Latest Claude model with vision capabilities',
  };
}