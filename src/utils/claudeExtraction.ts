import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Converts image buffer to base64 string
 * @param {Buffer} imageBuffer - The image buffer to encode
 * @param {string} mimeType - The MIME type of the image (e.g., 'image/jpeg')
 * @returns {string} Base64 encoded image string
 */
export function encodeImageToBase64(
  imageBuffer: Buffer, 
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
): string {
  return imageBuffer.toString('base64');
}

/**
 * Analyzes a business document using Claude Vision API
 * @param {Buffer} imageBuffer - The document image buffer
 * @param {string} mimeType - The MIME type of the image
 * @returns {Promise<ExtractedData>} Structured extraction results
 */
export async function analyzeDocumentWithClaude(
  imageBuffer: Buffer, 
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'
): Promise<ExtractedData> {
  try {
    // Encode image to base64
    const base64Image = encodeImageToBase64(imageBuffer, mimeType);
    
    // Create the analysis prompt
    const prompt = createDocumentAnalysisPrompt();
    
    // Call Claude Vision API
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    // Parse the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    return parseClaudeResponse(responseText);
    
  } catch (error) {
    console.error('Claude API Error:', error);
    throw new Error(`Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates the structured prompt for document analysis
 * @returns {string} The analysis prompt
 */
function createDocumentAnalysisPrompt(): string {
  return `You are analyzing a business document. Please follow these steps:

1. IDENTIFY the document type (receipt, invoice, contract, tax_form, other)

2. EXTRACT key fields in JSON format with the following structure:
   - For receipts: vendor, date, amount, tax, line_items
   - For invoices: vendor, invoice_number, date, due_date, amount, tax, line_items
   - For contracts: parties, contract_date, amount, duration, key_terms

3. For EACH field provide:
   - name: field identifier
   - value: extracted value
   - sourceText: exact text snippet from document (include context words around the value)
   - confidence: score from 0.0 to 1.0 based on text clarity and certainty

4. FLAG any unclear or ambiguous values with confidence < 0.7

5. CATEGORIZE the document purpose if clear (expense, income, legal, tax)

Return ONLY a valid JSON object in this exact format:
{
  "documentType": "receipt|invoice|contract|tax_form|other",
  "category": "expense|income|legal|tax|other",
  "fields": [
    {
      "name": "field_name",
      "value": "extracted_value", 
      "sourceText": "exact text from document with context",
      "confidence": 0.95
    }
  ],
  "flags": ["any warnings about unclear values"]
}

Be precise with sourceText - include 2-3 words of context around the actual value to help with bounding box alignment.`;
}

/**
 * Parses Claude's JSON response into structured data
 * @param {string} responseText - Raw response from Claude
 * @returns {ExtractedData} Parsed extraction results
 */
function parseClaudeResponse(responseText: string): ExtractedData {
  try {
    // Find JSON in response (Claude sometimes adds explanation before/after)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }
    
    const jsonData = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!jsonData.documentType || !Array.isArray(jsonData.fields)) {
      throw new Error('Invalid response format from Claude');
    }
    
    return {
      documentType: jsonData.documentType,
      category: jsonData.category || 'other',
      fields: jsonData.fields.map((field: any) => ({
        name: field.name,
        value: field.value,
        sourceText: field.sourceText,
        confidence: Math.min(Math.max(field.confidence || 0, 0), 1), // Clamp between 0-1
      })),
      flags: jsonData.flags || [],
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    throw new Error(`Response parsing failed: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
  }
}

/**
 * Type definitions for extracted data
 */
export interface ExtractedField {
  name: string;
  value: string;
  sourceText: string;
  confidence: number;
}

export interface ExtractedData {
  documentType: 'receipt' | 'invoice' | 'contract' | 'tax_form' | 'other';
  category: 'expense' | 'income' | 'legal' | 'tax' | 'other';
  fields: ExtractedField[];
  flags: string[];
  timestamp: string;
}

/**
 * Validates extracted field data
 * @param {ExtractedField} field - Field to validate
 * @returns {ExtractedField} Field with updated confidence if validation fails
 */
export function validateExtractedField(field: ExtractedField): ExtractedField {
  let confidence = field.confidence;
  
  // Apply format validation
  if (field.name.includes('date')) {
    const dateRegex = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/;
    if (!dateRegex.test(field.value)) {
      confidence *= 0.7; // Reduce confidence for invalid date format
    }
  }
  
  if (field.name.includes('amount') || field.name.includes('total') || field.name.includes('tax')) {
    const currencyRegex = /\$?\d+[,.]?\d*\.?\d*/;
    if (!currencyRegex.test(field.value)) {
      confidence *= 0.7; // Reduce confidence for invalid currency format
    }
  }
  
  if (field.name.includes('email')) {
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    if (!emailRegex.test(field.value)) {
      confidence *= 0.6; // Reduce confidence for invalid email format
    }
  }
  
  return {
    ...field,
    confidence: Math.max(confidence, 0.1), // Minimum confidence of 0.1
  };
}