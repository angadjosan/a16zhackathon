# Eigencompute TEE Integration

## Overview

This module integrates **Eigencompute's Trusted Execution Environment (TEE)** with **Claude Sonnet 4.5** to provide verifiable AI document extraction with cryptographic proofs.

## Architecture

```
Document Upload
    ↓
Generate SHA-256 Hash (Document Integrity)
    ↓
Eigencompute TEE
    ├─ Claude Sonnet 4.5 API Call (in secure enclave)
    ├─ TEE Attestation Generation
    └─ Cryptographic Proof Creation
    ↓
Field-Level Proofs
    ├─ Individual field hashes
    └─ Merkle tree root
    ↓
Store in Database
    ├─ Document hash
    ├─ Eigencompute proof ID
    ├─ TEE attestation
    └─ Field extractions with proofs
```

## Features

✅ **TEE-Verified AI Extraction**: All Claude API calls happen in a secure enclave  
✅ **Cryptographic Attestation**: Proves the extraction wasn't tampered with  
✅ **Field-Level Proofs**: Each extracted field has its own verification hash  
✅ **Merkle Tree Verification**: Efficient batch verification of all fields  
✅ **Re-Upload Verification**: Re-hash documents to verify integrity  

## Setup

### 1. Environment Variables

Create a `.env.local` file with:

```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-xxx

# Eigencompute Configuration
EIGENCOMPUTE_API_KEY=eigencompute_xxx
EIGENCOMPUTE_ENDPOINT=https://api.eigencompute.com
EIGENCOMPUTE_TEE_ENABLED=true
EIGENCOMPUTE_TEE_PLATFORM=SGX
```

### 2. Install Dependencies

```bash
npm install @anthropic-ai/sdk
```

## Usage

### Basic Document Processing

```typescript
import { createEigencomputeClient, buildExtractionPrompt } from '@/utils/eigencompute';
import crypto from 'crypto';

// 1. Initialize client
const client = createEigencomputeClient();

// 2. Prepare document
const imageBuffer = /* your file buffer */;
const imageBase64 = imageBuffer.toString('base64');
const docHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');

// 3. Build prompt
const prompt = buildExtractionPrompt('receipt');

// 4. Process through TEE
const response = await client.processDocument({
  imageBase64,
  docHash,
  model: 'claude-sonnet-4.5-20241022',
  prompt,
});

console.log('Proof ID:', response.proofId);
console.log('Attestation ID:', response.attestation.attestationId);
```

### Field-Level Proof Generation

```typescript
// Generate proof for each extracted field
const fieldProofs = response.extractedData.fields.map((field) => {
  const fieldProof = {
    field: field.field,
    value: field.value,
    sourceText: field.sourceText,
    confidence: field.confidence,
    model: response.metadata.model,
    eigencomputeProofId: response.proofId,
    timestamp: response.metadata.timestamp,
    proofHash: '', // Generated next
  };

  // Generate hash for this field
  fieldProof.proofHash = client.generateFieldProofHash(fieldProof);

  return fieldProof;
});
```

### Merkle Tree Creation

```typescript
// Build Merkle root from all field proofs
const proofHashes = fieldProofs.map(fp => fp.proofHash);
const merkleRoot = client.buildMerkleRoot(proofHashes);

console.log('Merkle root:', merkleRoot);
```

### Verification

```typescript
// Verify by re-uploading the same document
const newHash = crypto.createHash('sha256').update(reuploadedBuffer).digest('hex');
const verified = newHash === originalDocHash;

console.log(verified ? '✓ Verified' : '⚠️ Document altered');
```

## API Reference

### `EigencomputeClient`

Main client for TEE integration.

#### Methods

- **`processDocument(request)`**: Process document through TEE with Claude
  - Returns: `EigencomputeProcessResponse` with proof ID and attestation
  
- **`generateFieldProofHash(field)`**: Generate SHA-256 hash for field proof
  - Returns: 64-character hex string
  
- **`buildMerkleRoot(proofHashes)`**: Build Merkle tree from field proof hashes
  - Returns: Root hash as hex string
  
- **`verifyAttestation(attestation)`**: Verify TEE attestation is valid
  - Returns: `Promise<boolean>`

### Types

See `src/types/proof.types.ts` for complete type definitions:

- `TEEAttestation`: Cryptographic attestation from TEE
- `EigencomputeProof`: Complete proof with attestation
- `FieldProof`: Individual field extraction proof
- `DocumentProof`: Complete document proof structure
- `VerificationResult`: Re-upload verification result

## Proof Structure

### Document-Level Proof

```typescript
{
  docId: "550e8400-e29b-41d4-a716-446655440000",
  docHash: "8f3a2bc1d4e5f6...", // SHA-256 of document bytes
  documentType: "receipt",
  eigencomputeProof: {
    proofId: "proof_a3b2c1d4e5f6",
    attestation: {
      attestationId: "att_123456",
      platform: "SGX",
      measurements: { mrenclave: "...", mrsigner: "..." },
      signature: "...",
      timestamp: "2025-10-10T14:23:01Z"
    },
    merkleRoot: "f8e7d6c5b4a3..."
  },
  fields: [...],
  merkleRoot: "f8e7d6c5b4a3...",
  overallConfidence: 0.96,
  createdAt: "2025-10-10T14:23:01Z"
}
```

### Field-Level Proof

```typescript
{
  field: "total",
  value: 247.83,
  sourceText: "$247.83",
  confidence: 0.98,
  model: "claude-sonnet-4.5-20241022",
  eigencomputeProofId: "proof_a3b2c1d4e5f6",
  proofHash: "c5d4e3f2g1h0...", // SHA-256 of canonical field data
  timestamp: "2025-10-10T14:23:01Z"
}
```

## Security Considerations

1. **Document Hashing**: SHA-256 hashes ensure document integrity
2. **TEE Attestation**: Cryptographic proof that extraction happened in secure enclave
3. **Field Proofs**: Each field independently verifiable
4. **Merkle Trees**: Efficient verification of all fields together
5. **Immutable Records**: All proofs timestamped and stored permanently

## Testing

Run the example workflow:

```typescript
import { examples } from '@/utils/eigencompute.example';

// Run complete workflow
await examples.completeWorkflow();
```

## Integration with Other Components

### With Supabase (Database)

```typescript
// Store document proof in database
await supabase.from('documents').insert({
  id: documentProof.docId,
  doc_hash: documentProof.docHash,
  document_type: documentProof.documentType,
  merkle_root: documentProof.merkleRoot,
  eigencompute_proof_id: documentProof.eigencomputeProof.proofId
});

// Store field extractions
await supabase.from('extractions').insert(
  documentProof.fields.map(field => ({
    doc_id: documentProof.docId,
    field: field.field,
    value: field.value,
    source_text: field.sourceText,
    confidence: field.confidence,
    proof_hash: field.proofHash,
    eigencompute_proof_id: field.eigencomputeProofId
  }))
);
```

### With Google Vision (OCR)

```typescript
// After getting OCR results, align with Claude extractions
import { alignBoundingBoxes } from '@/utils/alignBoundingBoxes';

const enrichedFields = alignBoundingBoxes(
  documentProof.fields,
  ocrResults.words
);
```

## Troubleshooting

### Issue: "TEE processing failed"
- Check `EIGENCOMPUTE_API_KEY` is set correctly
- Verify `ANTHROPIC_API_KEY` is valid
- Check network connectivity to Eigencompute endpoint

### Issue: "Invalid response format from Claude"
- Verify prompt returns valid JSON
- Check Claude API response in logs
- Ensure model is `claude-sonnet-4.5-20241022`

### Issue: "Attestation verification failed"
- Check `EIGENCOMPUTE_TEE_ENABLED=true`
- Verify TEE platform is supported
- Check attestation signature format

## Future Enhancements

- [ ] Support for AWS Nitro Enclaves (in addition to SGX)
- [ ] Batch processing of multiple documents
- [ ] Streaming attestation updates
- [ ] Proof verification API endpoint
- [ ] Integration with blockchain for immutable storage

## Resources

- [Eigencompute Documentation](https://docs.eigencompute.com)
- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [TEE Attestation Overview](https://en.wikipedia.org/wiki/Trusted_execution_environment)
- [Merkle Trees](https://en.wikipedia.org/wiki/Merkle_tree)

---

**Author**: Aditya (Cryptography & Verification Lead)  
**Last Updated**: October 2025  
**Version**: 1.0.0

