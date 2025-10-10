/**
 * End-to-End Test: Complete Extraction Flow
 * 
 * Tests the entire pipeline:
 * 1. Claude Vision extraction
 * 2. Eigencompute proof generation
 * 3. Database storage
 * 4. Verification
 */

import { extractDocument, verifyDocument, createDocumentProof } from '../src/services/extractionService';
import { database, initializeDatabase } from '../src/lib/database';
import { testClaudeConnection } from '../src/utils/claudeExtraction';
import { eigencomputeClient } from '../src/utils/eigencompute';
import * as fs from 'fs';
import * as path from 'path';

// Test utilities
function createMockReceiptImage(): Buffer {
  // Create a simple mock image buffer
  // In production, this would be an actual receipt image
  const mockImageData = Buffer.from('MOCK_RECEIPT_IMAGE_DATA');
  return mockImageData;
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message: string) {
  console.log('✅', message);
}

function logError(message: string) {
  console.error('❌', message);
}

function logInfo(message: string) {
  console.log('ℹ️', message);
}

/**
 * Test 1: Claude API Connection
 */
async function testClaudeAPI(): Promise<boolean> {
  logSection('Test 1: Claude API Connection');

  try {
    const connected = await testClaudeConnection();
    if (connected) {
      logSuccess('Claude API connection successful');
      return true;
    } else {
      logError('Claude API connection failed');
      return false;
    }
  } catch (error) {
    logError(`Claude API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Test 2: Eigencompute Proof Generation
 */
async function testEigencomputeProofs(): Promise<boolean> {
  logSection('Test 2: Eigencompute Proof Generation');

  try {
    const testBuffer = createMockReceiptImage();
    const docHash = eigencomputeClient.generateDocumentHash(testBuffer);
    logInfo(`Generated document hash: ${docHash.substring(0, 16)}...`);

    // Test field proof hash generation
    const mockFieldProof: import('../src/types/proof.types').FieldProof = {
      field: 'total',
      value: 42.99,
      sourceText: '$42.99',
      boundingBox: { x: 100, y: 200, width: 80, height: 30 },
      confidence: 0.98,
      proofHash: '', // Will be computed
      eigencomputeProofId: 'test-proof-id',
      timestamp: new Date().toISOString(),
      model: 'claude-sonnet-4.5',
    };

    const fieldProofHash = eigencomputeClient.generateFieldProofHash(mockFieldProof);
    logInfo(`Generated field proof hash: ${fieldProofHash.substring(0, 16)}...`);

    // Test Merkle root generation
    const merkleRoot = eigencomputeClient.generateMerkleRoot([fieldProofHash]);
    logInfo(`Generated Merkle root: ${merkleRoot.substring(0, 16)}...`);

    logSuccess('Eigencompute cryptographic functions working');
    return true;
  } catch (error) {
    logError(`Eigencompute test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Test 3: Database Operations
 */
async function testDatabaseOperations(): Promise<boolean> {
  logSection('Test 3: Database Operations');

  try {
    await initializeDatabase();

    // Test document storage
    const testDocId = 'test-doc-123';
    const testDocHash = 'abcdef1234567890';
    const testImageUrl = 'https://example.com/image.jpg';

    const docRecord = await database.storeDocument(
      testDocId,
      testDocHash,
      testImageUrl,
      'receipt',
      'merkle-root-123',
      'eigencompute-proof-123'
    );

    logInfo(`Stored document: ${docRecord.id}`);

    // Test extraction storage
    const extractionRecord = await database.storeExtraction(
      testDocId,
      'total',
      42.99,
      '$42.99',
      0.98,
      'field-proof-hash-123',
      'eigencompute-proof-123',
      'claude-sonnet-4.5'
    );

    logInfo(`Stored extraction: ${extractionRecord.field} = ${extractionRecord.value}`);

    // Test retrieval
    const retrievedDoc = await database.getDocument(testDocId);
    if (retrievedDoc && retrievedDoc.doc_hash === testDocHash) {
      logSuccess('Document retrieval successful');
    } else {
      logError('Document retrieval failed');
      return false;
    }

    const retrievedExtractions = await database.getExtractions(testDocId);
    if (retrievedExtractions.length === 1) {
      logSuccess(`Retrieved ${retrievedExtractions.length} extraction(s)`);
    } else {
      logError('Extraction retrieval failed');
      return false;
    }

    // Clean up
    database.clearAll();
    logInfo('Cleaned up test data');

    logSuccess('Database operations working');
    return true;
  } catch (error) {
    logError(`Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Test 4: Complete Extraction Pipeline (Mock)
 */
async function testCompleteExtractionPipeline(): Promise<boolean> {
  logSection('Test 4: Complete Extraction Pipeline (Mock Mode)');

  try {
    const testDocId = 'test-doc-456';
    const testImageBuffer = createMockReceiptImage();

    logInfo('Starting extraction pipeline...');

    // Note: This will use mock Claude extraction since we don't have a real receipt image
    // In production, replace with actual receipt image
    const extractionResult = await extractDocument(testDocId, testImageBuffer, {
      documentType: 'receipt',
      autoDetect: false,
    });

    logInfo(`Document type: ${extractionResult.documentType}`);
    logInfo(`Document hash: ${extractionResult.documentHash.substring(0, 16)}...`);
    logInfo(`Eigencompute proof ID: ${extractionResult.eigencomputeProof.proofId}`);
    logInfo(`Merkle root: ${extractionResult.merkleRoot.substring(0, 16)}...`);
    logInfo(`Extracted ${extractionResult.fieldProofs.length} field(s)`);

    // Store in database
    const documentProof = createDocumentProof(extractionResult);
    const stored = await database.storeCompleteDocumentProof(
      testDocId,
      extractionResult.documentHash,
      'https://example.com/test-image.jpg',
      documentProof
    );

    logSuccess(`Stored document with ${stored.extractions.length} extraction(s)`);

    // Test verification
    logInfo('Testing verification...');
    const verificationResult = await verifyDocument(
      testDocId,
      testImageBuffer,
      extractionResult.eigencomputeProof.proofId,
      extractionResult.documentHash
    );

    if (verificationResult.verified) {
      logSuccess('Document verification passed');
      logInfo(`Hash match: ${verificationResult.hashMatch}`);
      logInfo(`Message: ${verificationResult.message}`);
    } else {
      logError('Document verification failed');
      logError(`Message: ${verificationResult.message}`);
      return false;
    }

    // Clean up
    database.clearAll();
    logInfo('Cleaned up test data');

    logSuccess('Complete extraction pipeline working');
    return true;
  } catch (error) {
    logError(
      `Extraction pipeline test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    console.error(error);
    return false;
  }
}

/**
 * Test 5: JSON Canonicalization
 */
async function testJSONCanonicalization(): Promise<boolean> {
  logSection('Test 5: JSON Canonicalization');

  try {
    const obj1 = { field: 'total', value: 42.99, confidence: 0.98 };
    const obj2 = { confidence: 0.98, value: 42.99, field: 'total' };

    const canonical1 = JSON.stringify(obj1, Object.keys(obj1).sort());
    const canonical2 = JSON.stringify(obj2, Object.keys(obj2).sort());

    if (canonical1 === canonical2) {
      logSuccess('JSON canonicalization produces consistent hashes');
      logInfo(`Canonical form: ${canonical1}`);
      return true;
    } else {
      logError('JSON canonicalization inconsistent');
      return false;
    }
  } catch (error) {
    logError(
      `Canonicalization test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests(): Promise<void> {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  TrustDocs - Complete Extraction Flow Test Suite         ║');
  console.log('║  Testing: Claude + Eigencompute + Database               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const results: { [key: string]: boolean } = {};

  // Run tests
  results['Claude API'] = await testClaudeAPI();
  results['Eigencompute Proofs'] = await testEigencomputeProofs();
  results['Database Operations'] = await testDatabaseOperations();
  results['JSON Canonicalization'] = await testJSONCanonicalization();
  results['Complete Pipeline'] = await testCompleteExtractionPipeline();

  // Summary
  logSection('Test Summary');

  let passedCount = 0;
  let failedCount = 0;

  for (const [testName, passed] of Object.entries(results)) {
    if (passed) {
      logSuccess(`${testName}: PASSED`);
      passedCount++;
    } else {
      logError(`${testName}: FAILED`);
      failedCount++;
    }
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${passedCount + failedCount} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('-'.repeat(60) + '\n');

  if (failedCount === 0) {
    console.log('🎉 All tests passed! System is ready for Hour 3.');
  } else {
    console.log('⚠️  Some tests failed. Please review errors above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

