/**
 * Eigencompute Usage Example
 * 
 * Demonstrates how to use the Eigencompute TEE client
 * for verifiable AI document extraction with Claude Sonnet 4.5
 */

import { createEigencomputeClient, buildExtractionPrompt } from './eigencompute';
import { DocumentProof, FieldProof } from '../types/proof.types';
import crypto from 'crypto';
import fs from 'fs';

/**
 * Example: Process a receipt through Eigencompute TEE
 */
export async function exampleProcessReceipt() {
  // 1. Initialize Eigencompute client
  const client = createEigencomputeClient();

  // 2. Read document image (in real usage, this comes from upload)
  const imagePath = './sample-receipt.jpg';
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');

  // 3. Generate document hash for integrity
  const docHash = crypto
    .createHash('sha256')
    .update(imageBuffer)
    .digest('hex');

  console.log('Document hash:', docHash);

  // 4. Build extraction prompt
  const prompt = buildExtractionPrompt('receipt');

  // 5. Process through TEE with Claude
  const response = await client.processDocument({
    imageBase64,
    docHash,
    model: 'claude-sonnet-4.5-20241022',
    prompt,
    metadata: {
      source: 'manual_upload',
      userId: 'demo_user',
    },
  });

  console.log('Eigencompute Proof ID:', response.proofId);
  console.log('TEE Attestation ID:', response.attestation.attestationId);
  console.log('Processing time:', response.metadata.processingTime, 'ms');

  // 6. Build field-level proofs
  const fieldProofs: FieldProof[] = response.extractedData.fields.map((field) => {
    const fieldProof: FieldProof = {
      field: field.field,
      value: field.value,
      sourceText: field.sourceText,
      confidence: field.confidence,
      model: response.metadata.model,
      eigencomputeProofId: response.proofId,
      proofHash: '', // Will be generated
      timestamp: response.metadata.timestamp,
    };

    // Generate proof hash
    fieldProof.proofHash = client.generateFieldProofHash(fieldProof);

    return fieldProof;
  });

  // 7. Build Merkle root from all field proofs
  const proofHashes = fieldProofs.map((fp) => fp.proofHash);
  const merkleRoot = client.buildMerkleRoot(proofHashes);

  console.log('Merkle root:', merkleRoot);

  // 8. Construct complete document proof
  const documentProof: DocumentProof = {
    docId: crypto.randomUUID(),
    docHash,
    documentType: response.extractedData.documentType as any,
    fields: fieldProofs,
    eigencomputeProof: {
      proofId: response.proofId,
      docHash,
      attestation: response.attestation,
      apiRequest: {
        model: response.metadata.model,
        timestamp: response.metadata.timestamp,
        requestHash: crypto.createHash('sha256').update(prompt).digest('hex'),
      },
      apiResponse: {
        responseHash: crypto
          .createHash('sha256')
          .update(JSON.stringify(response.extractedData))
          .digest('hex'),
        timestamp: response.metadata.timestamp,
      },
      merkleRoot,
      createdAt: new Date().toISOString(),
    },
    merkleRoot,
    overallConfidence:
      fieldProofs.reduce((sum, fp) => sum + fp.confidence, 0) /
      fieldProofs.length,
    processingTime: response.metadata.processingTime,
    createdAt: new Date().toISOString(),
  };

  return documentProof;
}

/**
 * Example: Verify a document by re-uploading
 */
export async function exampleVerifyDocument(
  originalDocHash: string,
  reuploadedImageBuffer: Buffer
) {
  // 1. Hash the re-uploaded document
  const newHash = crypto
    .createHash('sha256')
    .update(reuploadedImageBuffer)
    .digest('hex');

  // 2. Compare hashes
  const hashMatch = originalDocHash === newHash;

  // 3. Return verification result
  return {
    verified: hashMatch,
    newHash,
    originalHash: originalDocHash,
    hashMatch,
    message: hashMatch
      ? '✓ Verified: Document hash matches original'
      : '⚠️ Warning: Hash mismatch - document altered',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Example: Verify TEE attestation
 */
export async function exampleVerifyAttestation() {
  const client = createEigencomputeClient();

  // Sample attestation (in real usage, retrieved from database)
  const attestation = {
    attestationId: '550e8400-e29b-41d4-a716-446655440000',
    platform: 'SGX',
    measurements: {
      mrenclave: 'a'.repeat(64),
      mrsigner: 'b'.repeat(64),
    },
    signature: 'c'.repeat(64),
    timestamp: new Date().toISOString(),
  };

  const isValid = await client.verifyAttestation(attestation);

  console.log('Attestation valid:', isValid);

  return isValid;
}

/**
 * Example workflow: Complete document processing pipeline
 */
export async function exampleCompleteWorkflow() {
  console.log('=== Eigencompute Document Processing Workflow ===\n');

  // Step 1: Process document
  console.log('Step 1: Processing document through TEE...');
  const proof = await exampleProcessReceipt();
  console.log('✓ Document processed with proof:', proof.eigencomputeProof.proofId);
  console.log('✓ Extracted', proof.fields.length, 'fields');
  console.log('✓ Overall confidence:', (proof.overallConfidence * 100).toFixed(1), '%');
  console.log('✓ Merkle root:', proof.merkleRoot.substring(0, 16), '...\n');

  // Step 2: Display extracted fields
  console.log('Step 2: Extracted fields:');
  proof.fields.forEach((field) => {
    console.log(
      `  - ${field.field}: ${field.value} (${(field.confidence * 100).toFixed(0)}% confidence)`
    );
  });
  console.log();

  // Step 3: Verify attestation
  console.log('Step 3: Verifying TEE attestation...');
  const isValid = await exampleVerifyAttestation();
  console.log('✓ Attestation verified:', isValid);
  console.log();

  // Step 4: Simulate re-upload verification
  console.log('Step 4: Simulating document re-upload verification...');
  const imagePath = './sample-receipt.jpg';
  const imageBuffer = fs.readFileSync(imagePath);
  const verificationResult = await exampleVerifyDocument(
    proof.docHash,
    imageBuffer
  );
  console.log('✓', verificationResult.message);

  console.log('\n=== Workflow Complete ===');
}

// Export examples
export const examples = {
  processReceipt: exampleProcessReceipt,
  verifyDocument: exampleVerifyDocument,
  verifyAttestation: exampleVerifyAttestation,
  completeWorkflow: exampleCompleteWorkflow,
};

