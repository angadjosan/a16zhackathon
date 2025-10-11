# Quick Fix for Supabase Issues

## Current Problems:
1. ❌ Database tables not created
2. ❌ Storage bucket not created  
3. ❌ Row Level Security blocking uploads

## Step-by-Step Fix:

### 1. Create Database Tables
1. Go to your Supabase dashboard
2. Click **SQL Editor** (left sidebar)
3. Copy and paste this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_hash VARCHAR(64) NOT NULL UNIQUE,
  image_url TEXT,
  original_filename TEXT,
  file_size INTEGER,
  mime_type VARCHAR(50),
  document_type VARCHAR(50) CHECK (document_type IN ('receipt', 'invoice', 'contract')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extractions table
CREATE TABLE IF NOT EXISTS extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  field VARCHAR(100) NOT NULL,
  value TEXT,
  source_text TEXT,
  bounding_box JSONB,
  ocr_words JSONB,
  model VARCHAR(50) DEFAULT 'claude-sonnet-3.5',
  confidence DECIMAL(3,2),
  proof_hash VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proofs table
CREATE TABLE IF NOT EXISTS proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  extraction_id UUID REFERENCES extractions(id) ON DELETE CASCADE,
  proof_data JSONB NOT NULL,
  merkle_root VARCHAR(64),
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_doc_hash ON documents(doc_hash);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_extractions_doc_id ON extractions(doc_id);
CREATE INDEX IF NOT EXISTS idx_extractions_confidence ON extractions(confidence);
CREATE INDEX IF NOT EXISTS idx_proofs_merkle_root ON proofs(merkle_root);
CREATE INDEX IF NOT EXISTS idx_proofs_verification_status ON proofs(verification_status);
```

4. Click **Run**

### 2. Create Storage Bucket
1. Go to **Storage** (left sidebar)
2. Click **New bucket**
3. Name: `documents`
4. Set to **Public**
5. Click **Create bucket**

### 3. Fix Storage Policies
1. Go to **Storage** → **Policies**
2. Click **New Policy** for the `documents` bucket
3. Use this policy:

```sql
-- Allow public access to documents bucket
CREATE POLICY "Public Access" ON storage.objects
FOR ALL USING (bucket_id = 'documents');
```

4. Click **Save**

### 4. Alternative: Disable RLS Temporarily
If the above doesn't work, you can temporarily disable RLS:

1. Go to **Storage** → **Policies**
2. Find the `documents` bucket
3. Toggle off **Row Level Security** (temporarily for development)

### 5. Test
Restart your dev server and try uploading a file!

```bash
npm run dev
```
