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