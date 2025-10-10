// Core document and extraction types for TrustDocs

export interface DocumentUpload {
  file: File;
  documentType?: 'receipt' | 'invoice' | 'contract';
}

export interface ExtractedField {
  name: string;
  value: string | number;
  sourceText: string;
  confidence: number; // 0-1 scale
  boundingBox?: BoundingBox;
  ocrWords?: OCRWord[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRWord {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface DocumentAnalysis {
  documentType: 'receipt' | 'invoice' | 'contract' | 'unknown';
  fields: ExtractedField[];
  overallConfidence: number;
  processing: {
    claudeConfidence: number;
    ocrConfidence?: number;
    processingTimeMs: number;
  };
}

export interface ClaudeExtractionResponse {
  documentType: string;
  fields: Record<string, {
    value: any;
    confidence: number;
    sourceText: string;
  }>;
  processingNotes?: string[];
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}