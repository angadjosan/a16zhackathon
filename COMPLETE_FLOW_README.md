# TrustDocs Complete Upload and Verification Flow

This document describes the complete implementation of the TrustDocs document verification system with cryptographic proofs.

## 🔄 Complete Flow Overview

The system implements a comprehensive document verification pipeline:

```
1. User uploads document (JPG/PNG)
   ↓
2. Generate SHA-256(image_bytes) → docHash
   ↓
EXECUTE THESE IN EIGENLAYER TEE
3. Google Vision OCR → { fullText, words[], confidence }
   Each word has: { text, boundingBox, confidence }
   ↓
4. Claude extracts structured data + sourceText for each field
   Prompt: "Extract vendor, date, total. For each, return the 
            exact text snippet from OCR (sourceText)"
   ↓
5. Match Claude's sourceText to Google Vision's words
   → Get bounding boxes + confidence for each extracted field
   ↓
END EIGENLAYER TEE EXECUTION
6. Create verification proof for each field:
   {
     docHash: "8f3a2b...",
     field: "total",
     value: 247.83,
     sourceText: "$247.83",
     boundingBox: { x, y, width, height },
     confidence: 0.98,
     ocrWords: ["$247", ".83"],
     model: "claude-sonnet-4.5",
     timestamp: "2025-10-10T14:23:01Z"
   }
   ↓
7. Generate proofHash = SHA-256(JSON.stringify(proof))
   ↓
8. Store in Supabase. Add the Eigenlayer TEE onchain thing here somewhere
   - documents table: { id, docHash, imageUrl, timestamp }
   - extractions table: { docId, field, value, sourceText, boundingBox, ocrWords, model,
                          confidence, proofHash, timestamp }
   ↓
9. Display: Document with interactive bounding boxes + extracted data
   ↓
10. Verification: Re-upload → compare docHash → validate proofs
```

## 🏗️ Architecture

### Backend APIs

#### `/api/upload` (POST)
- **Input**: Multipart form with file
- **Process**: 
  1. Generate SHA-256 hash of document
  2. Check for existing document (deduplication)
  3. Upload to Supabase Storage
  4. **Eigenlayer TEE Execution**:
     - Google Vision OCR processing
     - Claude AI extraction
     - Bounding box alignment
     - Field proof generation
  5. Store in database with proofs
- **Output**: Document metadata + extracted fields + proofs

#### `/api/verify` (POST)
- **Input**: `{ docId: string, imageBuffer: string }` (base64)
- **Process**:
  1. Re-hash uploaded document
  2. Compare with original hash
  3. Verify field proofs
  4. Check for tampering
- **Output**: Verification result with detailed analysis

### Database Schema

```sql
-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  doc_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash
  image_url TEXT,
  original_filename TEXT,
  file_size INTEGER,
  mime_type VARCHAR(50),
  document_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extractions table with proofs
CREATE TABLE extractions (
  id UUID PRIMARY KEY,
  doc_id UUID REFERENCES documents(id),
  field VARCHAR(100) NOT NULL,
  value TEXT,
  source_text TEXT,
  bounding_box JSONB, -- {x, y, width, height}
  ocr_words JSONB, -- Array of OCR word objects
  model VARCHAR(50) DEFAULT 'claude-sonnet-4.5',
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  proof_hash VARCHAR(64), -- SHA-256 of proof data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Frontend Components

#### Main Upload Page (`/`)
- File upload with drag & drop
- Real-time processing status
- Display extracted data with proofs
- Interactive bounding boxes

#### Verification Demo (`/verification-demo`)
- Document ID input
- Re-upload for verification
- Detailed verification results
- Tamper detection display

## 🔐 Cryptographic Security

### Document Integrity
- **SHA-256 Hashing**: Every document gets a unique hash
- **Hash Comparison**: Re-uploaded documents are compared byte-by-byte
- **Tamper Detection**: Any modification changes the hash

### Field-Level Proofs
- **Individual Proofs**: Each extracted field gets a cryptographic proof
- **Proof Structure**:
  ```json
  {
    "docHash": "8f3a2b...",
    "field": "total",
    "value": 247.83,
    "sourceText": "$247.83",
    "confidence": 0.98,
    "timestamp": "2025-10-10T14:23:01Z"
  }
  ```
- **Proof Hash**: `SHA-256(JSON.stringify(proof))`

### Eigenlayer TEE Integration
- **Secure Processing**: OCR and AI extraction happen in trusted environment
- **Attestation**: Cryptographic proof that processing was done securely
- **Tamper Resistance**: Cannot be modified after processing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Google Cloud Vision API key
- Anthropic Claude API key

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Cloud Vision
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_api_key

# Eigenlayer TEE (optional)
EIGENCOMPUTE_API_KEY=your_eigencompute_api_key
EIGENCOMPUTE_ENDPOINT=https://api.eigencompute.com
EIGENCOMPUTE_TEE_ENABLED=true
```

### Installation
```bash
npm install
npm run dev
```

### Testing
```bash
# Run complete flow test
node run-complete-test.js

# Or run individual tests
npm run test
```

## 📊 API Examples

### Upload Document
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@receipt.jpg"
```

Response:
```json
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "docHash": "8f3a2b...",
    "documentType": "receipt",
    "extractedFields": [
      {
        "field": "total",
        "value": 247.83,
        "sourceText": "$247.83",
        "boundingBox": { "x": 100, "y": 200, "width": 80, "height": 20 },
        "confidence": 0.98,
        "proofHash": "a1b2c3..."
      }
    ],
    "processingTime": 2500
  }
}
```

### Verify Document
```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "docId": "uuid",
    "imageBuffer": "base64_encoded_image"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "verified": true,
    "hashMatch": true,
    "fieldProofsValid": true,
    "message": "✓ Verified: Document hash matches original and all field proofs are valid",
    "tamperedFields": [],
    "fieldVerifications": [
      {
        "field": "total",
        "verified": true,
        "reason": "Proof valid"
      }
    ]
  }
}
```

## 🔍 Verification Process

1. **Document Upload**: User uploads document, system generates hash and extracts data
2. **Proof Generation**: Each field gets a cryptographic proof
3. **Storage**: Document and proofs stored in database
4. **Verification**: User re-uploads document for verification
5. **Hash Comparison**: System compares new hash with original
6. **Proof Validation**: System validates all field proofs
7. **Result**: System returns detailed verification result

## 🛡️ Security Features

- **Cryptographic Integrity**: SHA-256 hashing ensures document integrity
- **Field-Level Proofs**: Each extracted field has its own proof
- **Tamper Detection**: Any modification is immediately detected
- **Secure Processing**: AI extraction happens in trusted environment
- **Audit Trail**: Complete history of all verifications

## 📈 Performance

- **Processing Time**: ~2-5 seconds for typical documents
- **Concurrent Uploads**: Supports multiple simultaneous uploads
- **Caching**: Duplicate documents are detected and reused
- **Optimization**: Parallel processing of OCR and AI extraction

## 🧪 Testing

The system includes comprehensive tests:

- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **End-to-End Tests**: Complete flow testing
- **Security Tests**: Tamper detection testing
- **Performance Tests**: Load and stress testing

Run tests with:
```bash
npm test
node run-complete-test.js
```

## 🚀 Deployment

### Production Setup
1. Set up Supabase production database
2. Configure Google Cloud Vision API
3. Set up Anthropic Claude API
4. Configure Eigenlayer TEE (optional)
5. Deploy to Vercel/Netlify

### Monitoring
- **Health Checks**: `/api/health` endpoint
- **Metrics**: Processing time, success rates
- **Logging**: Comprehensive logging for debugging
- **Alerts**: Error notifications

## 🔧 Troubleshooting

### Common Issues
1. **API Keys**: Ensure all API keys are correctly set
2. **Database**: Check Supabase connection and permissions
3. **File Size**: Ensure files are under 10MB limit
4. **File Types**: Only JPG, PNG, PDF are supported

### Debug Mode
Set `NODE_ENV=development` for detailed logging.

## 📚 Additional Resources

- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Database Schema](./database/schema.sql)
- [Test Reports](./test-reports/)
- [Setup Guide](./SETUP.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
