# TrustDocs API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000/api` (development)  
**Last Updated:** October 10, 2025

## Overview

The TrustDocs API provides endpoints for verifiable AI document extraction with cryptographic proofs. All endpoints return JSON responses and use standard HTTP methods and status codes.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Endpoints](#endpoints)
   - [POST /api/extract](#post-apiextract)
   - [POST /api/verify](#post-apiverify)
   - [GET /api/proof/:docId](#get-apiproofdocid)
   - [GET /api/documents](#get-apidocuments)
3. [Response Formats](#response-formats)
4. [Error Handling](#error-handling)
5. [Code Examples](#code-examples)

---

## Authentication

Currently, all endpoints are public for demo purposes. Production deployment will require authentication tokens.

---

## Endpoints

### POST /api/extract

Extract structured data from a document image with cryptographic proofs.

**URL:** `/api/extract`  
**Method:** `POST`  
**Content-Type:** `application/json`

#### Request Body

```json
{
  "docId": "550e8400-e29b-41d4-a716-446655440000",
  "imageBuffer": "base64_encoded_image_string",
  "documentType": "receipt" // optional: receipt | invoice | contract
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "docId": "550e8400-e29b-41d4-a716-446655440000",
    "docHash": "8f3a2bc1d4e5f6789012345678901234567890abcdef1234567890abcdef12",
    "documentType": "receipt",
    "fields": [
      {
        "field": "merchant",
        "value": "Whole Foods Market",
        "sourceText": "WHOLE FOODS MARKET",
        "confidence": 0.99,
        "proofHash": "a3f2b1c4d5e6..."
      },
      {
        "field": "total",
        "value": 42.50,
        "sourceText": "$42.50",
        "confidence": 0.98,
        "proofHash": "b4c3d2e5f6a7..."
      }
    ],
    "fieldProofs": [
      {
        "field": "merchant",
        "proofHash": "a3f2b1c4d5e6...",
        "eigencomputeProofId": "proof_abc123"
      }
    ],
    "merkleRoot": "f8e7d6c5b4a39281...",
    "eigencomputeProof": {
      "proofId": "proof_abc123",
      "attestation": {
        "platform": "SGX",
        "attestationId": "att_xyz789",
        "signature": "mock-signature-..."
      },
      "createdAt": "2025-10-10T14:23:01.234Z"
    },
    "overallConfidence": 0.97,
    "lowConfidenceFields": [],
    "processingTime": 5240
  }
}
```

#### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "path": ["docId"],
      "message": "Invalid UUID format"
    }
  ]
}
```

#### Example Usage

```javascript
// Extract document
const response = await fetch('http://localhost:3000/api/extract', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    docId: crypto.randomUUID(),
    imageBuffer: imageBuffer.toString('base64'),
    documentType: 'receipt', // optional
  }),
});

const result = await response.json();
console.log('Extraction result:', result.data);
```

---

### POST /api/verify

Verify a re-uploaded document against the original stored proof.

**URL:** `/api/verify`  
**Method:** `POST`  
**Content-Type:** `application/json`

#### Request Body

```json
{
  "docId": "550e8400-e29b-41d4-a716-446655440000",
  "imageBuffer": "base64_encoded_image_string"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "docId": "550e8400-e29b-41d4-a716-446655440000",
    "verified": true,
    "hashMatch": true,
    "newHash": "8f3a2bc1d4e5f6789012345678901234567890abcdef1234567890abcdef12",
    "originalHash": "8f3a2bc1d4e5f6789012345678901234567890abcdef1234567890abcdef12",
    "message": "✓ Verified: Document hash matches original",
    "attestationValid": true,
    "fieldProofsValid": true,
    "tamperedFields": [],
    "originalTimestamp": "2025-10-10T14:23:01.234Z",
    "verificationTimestamp": "2025-10-10T15:30:45.678Z",
    "verificationTime": 125
  }
}
```

#### Response (Failed Verification)

```json
{
  "success": true,
  "data": {
    "docId": "550e8400-e29b-41d4-a716-446655440000",
    "verified": false,
    "hashMatch": false,
    "newHash": "9a4b3c2d5e6f7890123456789012345678901234567890abcdef1234567890",
    "originalHash": "8f3a2bc1d4e5f6789012345678901234567890abcdef1234567890abcdef12",
    "message": "⚠️ Warning: Document hash does not match original",
    "attestationValid": true,
    "fieldProofsValid": false,
    "tamperedFields": ["total"],
    "originalTimestamp": "2025-10-10T14:23:01.234Z",
    "verificationTimestamp": "2025-10-10T15:30:45.678Z",
    "verificationTime": 130
  }
}
```

#### Example Usage

```javascript
// Verify document
const response = await fetch('http://localhost:3000/api/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    docId: '550e8400-e29b-41d4-a716-446655440000',
    imageBuffer: reuploadedImage.toString('base64'),
  }),
});

const result = await response.json();

if (result.data.verified) {
  console.log('✓ Document verified!');
} else {
  console.warn('⚠️ Document has been tampered with!');
  console.log('Tampered fields:', result.data.tamperedFields);
}
```

---

### GET /api/proof/:docId

Retrieve the complete proof for a document.

**URL:** `/api/proof/:docId`  
**Method:** `GET`  
**Query Parameters:**
- `field` (optional): Get proof for specific field only

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "docId": "550e8400-e29b-41d4-a716-446655440000",
    "docHash": "8f3a2bc1d4e5f6789012345678901234567890abcdef1234567890abcdef12",
    "imageUrl": "data:image/jpeg;base64,...",
    "documentType": "receipt",
    "merkleRoot": "f8e7d6c5b4a39281...",
    "createdAt": "2025-10-10T14:23:01.234Z",
    "eigencomputeProof": {
      "proofId": "proof_abc123",
      "model": "claude-sonnet-4.5",
      "attestation": {
        "platform": "SGX",
        "attestationId": "att_xyz789",
        "signature": "mock-signature-..."
      },
      "createdAt": "2025-10-10T14:23:01.234Z"
    },
    "fields": [
      {
        "id": "field_1",
        "field": "merchant",
        "value": "Whole Foods Market",
        "sourceText": "WHOLE FOODS MARKET",
        "boundingBox": { "x": 120, "y": 50, "width": 300, "height": 40 },
        "confidence": 0.99,
        "proofHash": "a3f2b1c4d5e6...",
        "eigencomputeProofId": "proof_abc123",
        "model": "claude-sonnet-4.5",
        "createdAt": "2025-10-10T14:23:01.234Z"
      }
    ],
    "summary": {
      "totalFields": 8,
      "averageConfidence": 0.97,
      "lowConfidenceFields": [],
      "highConfidenceFields": ["merchant", "total", "date"]
    }
  }
}
```

#### Field-Specific Proof Query

```bash
GET /api/proof/550e8400-e29b-41d4-a716-446655440000?field=total
```

Response includes only the specified field's proof data.

#### Example Usage

```javascript
// Get complete proof
const docId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(`http://localhost:3000/api/proof/${docId}`);
const result = await response.json();

console.log('Document proof:', result.data);
console.log('Merkle root:', result.data.merkleRoot);
console.log('Average confidence:', result.data.summary.averageConfidence);

// Get specific field proof
const fieldResponse = await fetch(
  `http://localhost:3000/api/proof/${docId}?field=total`
);
const fieldResult = await fieldResponse.json();
console.log('Total field proof:', fieldResult.data);
```

---

### GET /api/documents

List all processed documents with pagination and filtering.

**URL:** `/api/documents`  
**Method:** `GET`  
**Query Parameters:**
- `page` (default: 1): Page number
- `limit` (default: 50, max: 100): Items per page
- `type`: Filter by document type (`receipt`, `invoice`, `contract`)
- `sort` (default: `createdAt`): Sort by field (`createdAt`, `documentType`, `confidence`)
- `order` (default: `desc`): Sort order (`asc`, `desc`)

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "docHash": "8f3a2bc1d4e5f6789012345678901234567890abcdef1234567890abcdef12",
        "imageUrl": "data:image/jpeg;base64,...",
        "documentType": "receipt",
        "extractionCount": 8,
        "averageConfidence": 0.97,
        "createdAt": "2025-10-10T14:23:01.234Z",
        "proofId": "proof_abc123"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 42,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "filters": {
      "documentType": "all",
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  }
}
```

#### Example Usage

```javascript
// Get all documents (first page)
const response = await fetch('http://localhost:3000/api/documents');
const result = await response.json();
console.log('Documents:', result.data.documents);

// Get second page with 20 items
const page2 = await fetch('http://localhost:3000/api/documents?page=2&limit=20');

// Filter receipts only
const receipts = await fetch('http://localhost:3000/api/documents?type=receipt');

// Sort by confidence (lowest first)
const lowConfidence = await fetch(
  'http://localhost:3000/api/documents?sort=confidence&order=asc'
);
```

#### DELETE Endpoint

**URL:** `/api/documents`  
**Method:** `DELETE`  
**Description:** Clear all documents (for testing)

```javascript
// Clear all documents
const response = await fetch('http://localhost:3000/api/documents', {
  method: 'DELETE',
});
const result = await response.json();
console.log(result.message); // "All documents cleared successfully"
```

---

## Response Formats

### Success Response

All successful responses follow this format:

```json
{
  "success": true,
  "data": {
    // Endpoint-specific data
  }
}
```

### Error Response

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {} // Optional: additional error details
}
```

---

## Error Handling

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input data |
| 404 | Not Found - Document or proof not found |
| 500 | Internal Server Error - Server-side error |

### Common Errors

#### Invalid UUID Format

```json
{
  "success": false,
  "error": "Invalid document ID format",
  "message": "Document ID must be a valid UUID"
}
```

#### Document Not Found

```json
{
  "success": false,
  "error": "Document not found",
  "message": "No document found with ID: 550e8400-e29b-41d4-a716-446655440000"
}
```

#### Validation Error

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "path": ["imageBuffer"],
      "message": "Required field missing"
    }
  ]
}
```

---

## Code Examples

### Complete Document Processing Flow

```javascript
import crypto from 'crypto';
import fs from 'fs';

async function processDocument(imagePath) {
  // 1. Read image file
  const imageBuffer = fs.readFileSync(imagePath);
  const docId = crypto.randomUUID();

  console.log(`Processing document ${docId}...`);

  // 2. Extract document
  const extractResponse = await fetch('http://localhost:3000/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      docId,
      imageBuffer: imageBuffer.toString('base64'),
    }),
  });

  const extractResult = await extractResponse.json();

  if (!extractResult.success) {
    throw new Error(`Extraction failed: ${extractResult.message}`);
  }

  console.log('✓ Extraction complete');
  console.log(`  - Document type: ${extractResult.data.documentType}`);
  console.log(`  - Fields extracted: ${extractResult.data.fields.length}`);
  console.log(`  - Overall confidence: ${extractResult.data.overallConfidence}`);

  // 3. Get proof
  const proofResponse = await fetch(`http://localhost:3000/api/proof/${docId}`);
  const proofResult = await proofResponse.json();

  console.log('✓ Proof retrieved');
  console.log(`  - Merkle root: ${proofResult.data.merkleRoot.substring(0, 16)}...`);
  console.log(`  - Proof ID: ${proofResult.data.eigencomputeProof.proofId}`);

  // 4. Verify document
  const verifyResponse = await fetch('http://localhost:3000/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      docId,
      imageBuffer: imageBuffer.toString('base64'),
    }),
  });

  const verifyResult = await verifyResponse.json();

  if (verifyResult.data.verified) {
    console.log('✓ Document verified successfully');
  } else {
    console.warn('⚠️ Verification failed!');
    console.log(`  - Tampered fields: ${verifyResult.data.tamperedFields.join(', ')}`);
  }

  return {
    docId,
    extraction: extractResult.data,
    proof: proofResult.data,
    verification: verifyResult.data,
  };
}

// Run the process
processDocument('./sample-receipt.jpg')
  .then((result) => console.log('Complete!', result))
  .catch((error) => console.error('Error:', error));
```

### List and Filter Documents

```javascript
async function listDocuments(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`http://localhost:3000/api/documents?${params}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(`Failed to list documents: ${result.message}`);
  }

  return result.data;
}

// Usage examples
const allDocs = await listDocuments();
const receipts = await listDocuments({ type: 'receipt' });
const lowConfidence = await listDocuments({ sort: 'confidence', order: 'asc' });
const page2 = await listDocuments({ page: 2, limit: 20 });

console.log(`Total documents: ${allDocs.pagination.total}`);
console.log(`Receipts: ${receipts.documents.length}`);
```

### Batch Verification

```javascript
async function verifyAllDocuments() {
  // Get all documents
  const { documents } = await listDocuments();

  console.log(`Verifying ${documents.length} documents...`);

  // Verify each document
  const results = await Promise.all(
    documents.map(async (doc) => {
      // Re-fetch the image (in real app, get from storage)
      const imageResponse = await fetch(doc.imageUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // Verify
      const verifyResponse = await fetch('http://localhost:3000/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId: doc.id,
          imageBuffer: imageBuffer.toString('base64'),
        }),
      });

      const verifyResult = await verifyResponse.json();

      return {
        docId: doc.id,
        verified: verifyResult.data.verified,
        tamperedFields: verifyResult.data.tamperedFields,
      };
    })
  );

  const verified = results.filter((r) => r.verified).length;
  const tampered = results.filter((r) => !r.verified).length;

  console.log(`✓ Verified: ${verified}`);
  console.log(`⚠️ Tampered: ${tampered}`);

  return results;
}

// Run batch verification
verifyAllDocuments()
  .then((results) => console.log('Batch verification complete:', results))
  .catch((error) => console.error('Error:', error));
```

---

## API Testing

Run the API integration tests:

```bash
npm run test:api
```

This will verify that all API endpoints are properly structured and integrated with the extraction service and database.

---

## Next Steps

### For Frontend Integration

1. Use `/api/extract` in your upload flow
2. Display extraction results with confidence badges
3. Implement re-upload verification UI with `/api/verify`
4. Show document history using `/api/documents`
5. Display detailed proofs with `/api/proof/:docId`

### For Production Deployment

1. Add authentication middleware
2. Implement rate limiting
3. Set up HTTPS/TLS
4. Configure CORS for your domain
5. Add request logging and monitoring
6. Implement caching for proof retrieval
7. Add WebSocket support for real-time extraction updates

---

## Support

For issues or questions about the API, please refer to:
- [Project README](../README.md)
- [Hour 3 Summary](../test-reports/HOUR_3_SUMMARY.md)
- [GitHub Issues](https://github.com/angadjosan/a16zhackathon/issues)

---

**Document Version:** 1.0.0  
**Last Updated:** October 10, 2025  
**Maintained by:** TrustDocs Team

