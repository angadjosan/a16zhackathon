import { z } from "zod";

// Bounding box for OCR coordinates
export const BoundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

// OCR word with confidence and position
export const OCRWordSchema = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(1),
  boundingBox: BoundingBoxSchema,
});

export type OCRWord = z.infer<typeof OCRWordSchema>;

// Document types
export const DocumentTypeSchema = z.enum(["receipt", "invoice", "contract", "tax_form", "other"]);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

// Extracted field from Claude
export const ExtractedFieldSchema = z.object({
  name: z.string(),
  value: z.unknown(),
  sourceText: z.string(),
  confidence: z.number().min(0).max(1),
  boundingBox: BoundingBoxSchema.optional(),
  ocrWords: z.array(OCRWordSchema).optional(),
});

export type ExtractedField = z.infer<typeof ExtractedFieldSchema>;

// Claude extraction response
export const ClaudeExtractionSchema = z.object({
  documentType: DocumentTypeSchema,
  fields: z.array(ExtractedFieldSchema),
  processingTime: z.number().optional(),
  totalConfidence: z.number().min(0).max(1).optional(),
});

export type ClaudeExtraction = z.infer<typeof ClaudeExtractionSchema>;

// Google Vision OCR response
export const OCRResultSchema = z.object({
  fullText: z.string(),
  words: z.array(OCRWordSchema),
  processingTime: z.number().optional(),
});

export type OCRResult = z.infer<typeof OCRResultSchema>;

// Combined processing result
export const DocumentProcessingResultSchema = z.object({
  documentId: z.string(),
  documentType: DocumentTypeSchema,
  fields: z.array(ExtractedFieldSchema),
  ocrResult: OCRResultSchema,
  processingTime: z.number(),
  timestamp: z.string(),
});

export type DocumentProcessingResult = z.infer<typeof DocumentProcessingResultSchema>;

// Confidence levels for UI
export const ConfidenceLevelSchema = z.enum(["high", "medium", "low"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

// Helper function to determine confidence level
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.95) return "high";
  if (confidence >= 0.80) return "medium";
  return "low";
}

// API Error types
export class DocumentProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "DocumentProcessingError";
  }
}

export class ClaudeAPIError extends DocumentProcessingError {
  constructor(message: string, details?: unknown) {
    super(message, "CLAUDE_API_ERROR", details);
    this.name = "ClaudeAPIError";
  }
}

export class GoogleVisionError extends DocumentProcessingError {
  constructor(message: string, details?: unknown) {
    super(message, "GOOGLE_VISION_ERROR", details);
    this.name = "GoogleVisionError";
  }
}