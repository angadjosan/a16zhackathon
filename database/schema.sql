-- TrustDocs Database Schema
-- Created for Aadit's Hour 2 tasks

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Documents table - stores uploaded documents with cryptographic hashes
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash for tamper detection
  image_url TEXT,
  original_filename TEXT,
  file_size INTEGER,
  mime_type VARCHAR(50),
  document_type VARCHAR(50) CHECK (document_type IN ('receipt', 'invoice', 'contract')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extractions table - stores AI-extracted fields with proofs
CREATE TABLE extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  field VARCHAR(100) NOT NULL,
  value TEXT,
  source_text TEXT,
  bounding_box JSONB, -- {x, y, width, height}
  ocr_words JSONB, -- Array of OCR word objects with confidence scores
  model VARCHAR(50) DEFAULT 'claude-sonnet-3.5',
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  proof_hash VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proofs table - stores verification proofs for audit trail
CREATE TABLE proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  extraction_id UUID REFERENCES extractions(id) ON DELETE CASCADE,
  proof_data JSONB NOT NULL,
  merkle_root VARCHAR(64),
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_documents_doc_hash ON documents(doc_hash);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_extractions_doc_id ON extractions(doc_id);
CREATE INDEX idx_extractions_confidence ON extractions(confidence);
CREATE INDEX idx_proofs_merkle_root ON proofs(merkle_root);
CREATE INDEX idx_proofs_verification_status ON proofs(verification_status);

-- Row Level Security (RLS) policies (commented out for hackathon demo)
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;

-- Sample policies for production use:
-- CREATE POLICY "Users can view their own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert their own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
