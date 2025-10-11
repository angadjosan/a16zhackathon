-- Add OCR data storage to documents table
-- This stores the full Google Vision OCR results with all words and bounding boxes
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_data JSONB;

-- Add Claude data storage to documents table  
-- This stores the full Claude extraction response with all fields and metadata
ALTER TABLE documents ADD COLUMN IF NOT EXISTS claude_data JSONB;

-- Add indexes for JSONB queries (improves performance)
CREATE INDEX IF NOT EXISTS idx_documents_ocr_data ON documents USING GIN (ocr_data);
CREATE INDEX IF NOT EXISTS idx_documents_claude_data ON documents USING GIN (claude_data);

-- Update schema comments
COMMENT ON COLUMN documents.ocr_data IS 'Full Google Vision OCR results with all words and bounding boxes';
COMMENT ON COLUMN documents.claude_data IS 'Full Claude extraction response with all fields and metadata';

