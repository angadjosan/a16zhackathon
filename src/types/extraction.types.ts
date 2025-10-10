/**
 * Claude Structured Extraction Types
 * 
 * Defines JSON schemas and TypeScript types for Claude Sonnet 4.5
 * document extraction with structured output
 */

import { z } from 'zod';

/**
 * Bounding box coordinates for extracted fields
 */
export const BoundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

/**
 * Base extracted field with confidence and source
 */
export const ExtractedFieldSchema = z.object({
  field: z.string(),
  value: z.unknown(),
  sourceText: z.string(),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
});

export type ExtractedField = z.infer<typeof ExtractedFieldSchema>;

/**
 * Line item for receipts and invoices
 */
export const LineItemSchema = z.object({
  name: z.string(),
  quantity: z.number().optional(),
  price: z.number(),
  total: z.number().optional(),
  sourceText: z.string(),
  confidence: z.number().min(0).max(1),
});

export type LineItem = z.infer<typeof LineItemSchema>;

/**
 * Receipt extraction schema
 */
export const ReceiptExtractionSchema = z.object({
  documentType: z.literal('receipt'),
  fields: z.array(
    z.object({
      field: z.enum([
        'merchant',
        'date',
        'total',
        'subtotal',
        'tax',
        'category',
        'paymentMethod',
      ]),
      value: z.unknown(),
      sourceText: z.string(),
      confidence: z.number().min(0).max(1),
      notes: z.string().optional(),
    })
  ),
  lineItems: z.array(LineItemSchema).optional(),
});

export type ReceiptExtraction = z.infer<typeof ReceiptExtractionSchema>;

/**
 * Invoice extraction schema
 */
export const InvoiceExtractionSchema = z.object({
  documentType: z.literal('invoice'),
  fields: z.array(
    z.object({
      field: z.enum([
        'vendor',
        'invoiceNumber',
        'date',
        'dueDate',
        'amount',
        'subtotal',
        'tax',
        'paymentTerms',
        'billTo',
        'shipTo',
      ]),
      value: z.unknown(),
      sourceText: z.string(),
      confidence: z.number().min(0).max(1),
      notes: z.string().optional(),
    })
  ),
  lineItems: z.array(LineItemSchema).optional(),
});

export type InvoiceExtraction = z.infer<typeof InvoiceExtractionSchema>;

/**
 * Contract extraction schema
 */
export const ContractExtractionSchema = z.object({
  documentType: z.literal('contract'),
  fields: z.array(
    z.object({
      field: z.enum([
        'parties',
        'effectiveDate',
        'expirationDate',
        'contractType',
        'keyTerms',
        'obligations',
        'paymentTerms',
        'terminationClause',
      ]),
      value: z.unknown(),
      sourceText: z.string(),
      confidence: z.number().min(0).max(1),
      notes: z.string().optional(),
    })
  ),
});

export type ContractExtraction = z.infer<typeof ContractExtractionSchema>;

/**
 * Union type for all extraction types
 */
export const DocumentExtractionSchema = z.union([
  ReceiptExtractionSchema,
  InvoiceExtractionSchema,
  ContractExtractionSchema,
]);

export type DocumentExtraction = z.infer<typeof DocumentExtractionSchema>;

/**
 * Claude extraction prompt templates
 */
export const CLAUDE_EXTRACTION_PROMPTS = {
  receipt: `You are analyzing a receipt image. Extract the following information and return as JSON:

{
  "documentType": "receipt",
  "fields": [
    {
      "field": "merchant",
      "value": "extracted merchant name",
      "sourceText": "exact text from image",
      "confidence": 0.95,
      "notes": "optional clarification"
    },
    {
      "field": "date",
      "value": "YYYY-MM-DD",
      "sourceText": "exact date text from image",
      "confidence": 0.98
    },
    {
      "field": "total",
      "value": 42.50,
      "sourceText": "$42.50",
      "confidence": 0.99
    }
  ],
  "lineItems": [
    {
      "name": "Item name",
      "quantity": 2,
      "price": 10.00,
      "total": 20.00,
      "sourceText": "exact line item text",
      "confidence": 0.92
    }
  ]
}

Extract ALL visible fields. For confidence: 1.0 = perfectly clear, 0.5 = somewhat unclear, 0.0 = illegible.
Return ONLY the JSON, no other text.`,

  invoice: `You are analyzing an invoice image. Extract the following information and return as JSON:

{
  "documentType": "invoice",
  "fields": [
    {
      "field": "vendor",
      "value": "Company Name",
      "sourceText": "exact vendor text from image",
      "confidence": 0.98
    },
    {
      "field": "invoiceNumber",
      "value": "INV-2025-001",
      "sourceText": "exact invoice number",
      "confidence": 0.99
    },
    {
      "field": "date",
      "value": "YYYY-MM-DD",
      "sourceText": "exact date text",
      "confidence": 0.97
    },
    {
      "field": "amount",
      "value": 1250.00,
      "sourceText": "$1,250.00",
      "confidence": 0.99
    }
  ],
  "lineItems": [
    {
      "name": "Service/Product",
      "quantity": 1,
      "price": 1000.00,
      "total": 1000.00,
      "sourceText": "exact line item text",
      "confidence": 0.95
    }
  ]
}

Extract ALL visible fields including payment terms, dates, and line items.
Return ONLY the JSON, no other text.`,

  contract: `You are analyzing a contract image. Extract the following information and return as JSON:

{
  "documentType": "contract",
  "fields": [
    {
      "field": "parties",
      "value": "Party A and Party B",
      "sourceText": "exact party names from document",
      "confidence": 0.98
    },
    {
      "field": "effectiveDate",
      "value": "YYYY-MM-DD",
      "sourceText": "exact effective date text",
      "confidence": 0.95
    },
    {
      "field": "keyTerms",
      "value": "Summary of key terms",
      "sourceText": "relevant text from contract",
      "confidence": 0.85
    }
  ]
}

Extract all key contractual elements. Focus on parties, dates, obligations, and payment terms.
Return ONLY the JSON, no other text.`,
};

/**
 * JSON schema for Claude API (for documentation)
 */
export const RECEIPT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    documentType: { type: 'string', enum: ['receipt'] },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            enum: [
              'merchant',
              'date',
              'total',
              'subtotal',
              'tax',
              'category',
              'paymentMethod',
            ],
          },
          value: {},
          sourceText: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          notes: { type: 'string' },
        },
        required: ['field', 'value', 'sourceText', 'confidence'],
      },
    },
    lineItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'number' },
          price: { type: 'number' },
          total: { type: 'number' },
          sourceText: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: ['name', 'price', 'sourceText', 'confidence'],
      },
    },
  },
  required: ['documentType', 'fields'],
};

export const INVOICE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    documentType: { type: 'string', enum: ['invoice'] },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            enum: [
              'vendor',
              'invoiceNumber',
              'date',
              'dueDate',
              'amount',
              'subtotal',
              'tax',
              'paymentTerms',
              'billTo',
              'shipTo',
            ],
          },
          value: {},
          sourceText: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          notes: { type: 'string' },
        },
        required: ['field', 'value', 'sourceText', 'confidence'],
      },
    },
    lineItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'number' },
          price: { type: 'number' },
          total: { type: 'number' },
          sourceText: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: ['name', 'price', 'sourceText', 'confidence'],
      },
    },
  },
  required: ['documentType', 'fields'],
};

export const CONTRACT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    documentType: { type: 'string', enum: ['contract'] },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            enum: [
              'parties',
              'effectiveDate',
              'expirationDate',
              'contractType',
              'keyTerms',
              'obligations',
              'paymentTerms',
              'terminationClause',
            ],
          },
          value: {},
          sourceText: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          notes: { type: 'string' },
        },
        required: ['field', 'value', 'sourceText', 'confidence'],
      },
    },
  },
  required: ['documentType', 'fields'],
};

/**
 * Get prompt for document type
 */
export function getExtractionPrompt(documentType: 'receipt' | 'invoice' | 'contract'): string {
  return CLAUDE_EXTRACTION_PROMPTS[documentType];
}

/**
 * Get JSON schema for document type
 */
export function getJSONSchema(documentType: 'receipt' | 'invoice' | 'contract') {
  switch (documentType) {
    case 'receipt':
      return RECEIPT_JSON_SCHEMA;
    case 'invoice':
      return INVOICE_JSON_SCHEMA;
    case 'contract':
      return CONTRACT_JSON_SCHEMA;
  }
}

/**
 * Validate Claude extraction response
 */
export function validateExtraction(data: unknown): DocumentExtraction {
  return DocumentExtractionSchema.parse(data);
}

