// Core document and extraction types for TrustDocs

// Field type enumeration for confidence scoring
export enum FieldType {
  DATE = 'date',
  CURRENCY = 'currency',
  EMAIL = 'email',
  PHONE = 'phone',
  VENDOR = 'vendor',
  AMOUNT = 'amount',
  TAX = 'tax',
  LINE_ITEMS = 'line_items',
  UNKNOWN = 'unknown',
}

// Confidence metrics for field-level analysis
export interface ConfidenceMetrics {
  baseConfidence: number;        // Average of OCR and Claude confidence
  adjustedConfidence: number;    // Final confidence after adjustments
  confidenceLevel: 'high' | 'medium' | 'low';
  colorCode: string;             // Hex color for UI display
  fieldType: FieldType;          // Detected field type
  formatValid: boolean;          // Whether format validation passed
  adjustments: string[];         // List of adjustments applied
  crossValidationPassed?: boolean; // Whether cross-validation passed (for amounts)
}

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
  // Hour 5 additions for confidence scoring
  fieldType?: FieldType;
  claudeConfidence?: number;
  ocrConfidence?: number;
  alignmentQuality?: number; // 0-1 scale for bounding box alignment quality
  confidenceMetrics?: ConfidenceMetrics;
  finalConfidence?: number; // Calculated final confidence score
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

// Database types
export interface Document {
  id: string;
  doc_hash: string;
  image_url: string;
  original_filename: string | null;
  file_size: number;
  mime_type: string;
  document_type: 'receipt' | 'invoice' | 'contract' | null;
  created_at: string;
  updated_at: string;
}

export interface Extraction {
  id: string;
  doc_id: string;
  field: string;
  value: string | null;
  source_text: string | null;
  bounding_box: BoundingBox | null;
  ocr_words: OCRWord[] | null;
  model: string;
  confidence: number;
  proof_hash: string | null;
  created_at: string;
}

export interface VerificationProof {
  id: string;
  extraction_id: string;
  proof_data: {
    docHash: string;
    field: string;
    value: unknown;
    sourceText: string;
    confidence: number;
    timestamp: string;
  };
  merkle_root: string | null;
  verification_status: 'pending' | 'verified' | 'failed';
  created_at: string;
}

// API Response types
export interface UploadResponse {
  success: boolean;
  data?: {
    fileId: string;
    filename: string;
    timestamp: string;
    docHash: string;
    fileSize: number;
    mimeType: string;
    imageUrl: string;
  };
  error?: string;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}