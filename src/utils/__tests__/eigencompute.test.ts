/**
 * Eigencompute Integration Tests
 * 
 * Tests for TEE integration with Claude Sonnet 4.5
 * Note: These tests use mock data. For real testing, add actual receipt images.
 */

import crypto from 'crypto';
import { createEigencomputeClient, buildExtractionPrompt } from '../eigencompute';
import { EigencomputeProcessRequest, DocumentProof } from '../../types/proof.types';

/**
 * Mock document image (base64 encoded 1x1 pixel)
 * In production, replace with actual receipt/invoice images
 */
const MOCK_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Generate mock document hash
 */
function generateMockDocHash(): string {
  const buffer = Buffer.from(MOCK_IMAGE_BASE64, 'base64');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Test 1: Client Initialization
 */
export async function testClientInitialization() {
  console.log('Test 1: Client Initialization...');
  
  try {
    const client = createEigencomputeClient();
    console.log('✓ Client created successfully');
    console.log('  Config loaded from environment variables');
    return true;
  } catch (error) {
    console.error('✗ Client initialization failed:', error);
    return false;
  }
}

/**
 * Test 2: Proof Structure Generation
 */
export async function testProofStructure() {
  console.log('\nTest 2: Proof Structure Generation...');
  
  try {
    const client = createEigencomputeClient();
    
    // Create mock field proof
    const mockFieldProof = {
      field: 'total',
      value: 247.83,
      sourceText: '$247.83',
      confidence: 0.98,
      model: 'claude-sonnet-4.5-20241022',
      eigencomputeProofId: 'proof_test123',
      proofHash: '',
      timestamp: new Date().toISOString(),
    };
    
    // Generate proof hash
    const proofHash = client.generateFieldProofHash(mockFieldProof);
    
    console.log('✓ Field proof hash generated:', proofHash.substring(0, 16), '...');
    console.log('  Hash length:', proofHash.length, 'characters');
    
    // Verify hash is deterministic
    const proofHash2 = client.generateFieldProofHash(mockFieldProof);
    const isDeterministic = proofHash === proofHash2;
    
    console.log('✓ Hash is deterministic:', isDeterministic);
    
    return isDeterministic && proofHash.length === 64;
  } catch (error) {
    console.error('✗ Proof structure generation failed:', error);
    return false;
  }
}

/**
 * Test 3: Merkle Tree Construction
 */
export async function testMerkleTree() {
  console.log('\nTest 3: Merkle Tree Construction...');
  
  try {
    const client = createEigencomputeClient();
    
    // Create mock field proof hashes
    const mockProofHashes = [
      crypto.randomBytes(32).toString('hex'),
      crypto.randomBytes(32).toString('hex'),
      crypto.randomBytes(32).toString('hex'),
      crypto.randomBytes(32).toString('hex'),
    ];
    
    // Build Merkle root
    const merkleRoot = client.buildMerkleRoot(mockProofHashes);
    
    console.log('✓ Merkle root generated:', merkleRoot.substring(0, 16), '...');
    console.log('  Input hashes:', mockProofHashes.length);
    console.log('  Root hash length:', merkleRoot.length, 'characters');
    
    // Test edge cases
    const emptyRoot = client.buildMerkleRoot([]);
    const singleRoot = client.buildMerkleRoot([mockProofHashes[0]]);
    
    console.log('✓ Empty tree handled:', emptyRoot === '');
    console.log('✓ Single hash tree handled:', singleRoot === mockProofHashes[0]);
    
    return merkleRoot.length === 64;
  } catch (error) {
    console.error('✗ Merkle tree construction failed:', error);
    return false;
  }
}

/**
 * Test 4: Prompt Generation
 */
export async function testPromptGeneration() {
  console.log('\nTest 4: Extraction Prompt Generation...');
  
  try {
    const prompt = buildExtractionPrompt('receipt');
    
    console.log('✓ Prompt generated');
    console.log('  Length:', prompt.length, 'characters');
    console.log('  Includes "receipt":', prompt.includes('receipt'));
    console.log('  Includes "JSON":', prompt.includes('JSON'));
    console.log('  Includes "confidence":', prompt.includes('confidence'));
    
    return prompt.length > 0 && prompt.includes('JSON');
  } catch (error) {
    console.error('✗ Prompt generation failed:', error);
    return false;
  }
}

/**
 * Test 5: Document Hash Verification
 */
export async function testDocumentHashing() {
  console.log('\nTest 5: Document Hash Verification...');
  
  try {
    // Generate hash from mock image
    const docHash1 = generateMockDocHash();
    const docHash2 = generateMockDocHash();
    
    console.log('✓ Document hash generated:', docHash1.substring(0, 16), '...');
    console.log('  Hash length:', docHash1.length, 'characters');
    console.log('✓ Hash is deterministic:', docHash1 === docHash2);
    
    // Test hash uniqueness
    const differentImage = Buffer.from('different data');
    const differentHash = crypto.createHash('sha256').update(differentImage).digest('hex');
    const isUnique = docHash1 !== differentHash;
    
    console.log('✓ Different images produce different hashes:', isUnique);
    
    return docHash1.length === 64 && docHash1 === docHash2 && isUnique;
  } catch (error) {
    console.error('✗ Document hashing failed:', error);
    return false;
  }
}

/**
 * Test 6: Mock TEE Processing (without actual API call)
 */
export async function testMockTEEProcessing() {
  console.log('\nTest 6: Mock TEE Processing Flow...');
  
  try {
    const client = createEigencomputeClient();
    
    // Mock response structure (simulating what processDocument would return)
    const mockResponse = {
      proofId: 'proof_mock123456',
      attestation: {
        attestationId: crypto.randomUUID(),
        platform: 'SGX',
        measurements: {
          mrenclave: crypto.randomBytes(32).toString('hex'),
          mrsigner: crypto.randomBytes(32).toString('hex'),
        },
        signature: crypto.randomBytes(32).toString('hex'),
        timestamp: new Date().toISOString(),
      },
      extractedData: {
        documentType: 'receipt',
        fields: [
          {
            field: 'merchant',
            value: 'Test Store',
            sourceText: 'TEST STORE',
            confidence: 0.99,
          },
          {
            field: 'total',
            value: 247.83,
            sourceText: '$247.83',
            confidence: 0.98,
          },
          {
            field: 'date',
            value: '2025-10-10',
            sourceText: '10/10/2025',
            confidence: 0.97,
          },
        ],
      },
      metadata: {
        processingTime: 1234,
        model: 'claude-sonnet-4.5-20241022',
        timestamp: new Date().toISOString(),
      },
    };
    
    console.log('✓ Mock response structure created');
    console.log('  Proof ID:', mockResponse.proofId);
    console.log('  Attestation ID:', mockResponse.attestation.attestationId);
    console.log('  Extracted', mockResponse.extractedData.fields.length, 'fields');
    
    // Generate field proofs
    const fieldProofs = mockResponse.extractedData.fields.map((field) => {
      const fp = {
        ...field,
        model: mockResponse.metadata.model,
        eigencomputeProofId: mockResponse.proofId,
        proofHash: '',
        timestamp: mockResponse.metadata.timestamp,
      };
      fp.proofHash = client.generateFieldProofHash(fp);
      return fp;
    });
    
    // Generate Merkle root
    const merkleRoot = client.buildMerkleRoot(fieldProofs.map(fp => fp.proofHash));
    
    console.log('✓ Field proofs generated:', fieldProofs.length);
    console.log('✓ Merkle root:', merkleRoot.substring(0, 16), '...');
    
    // Verify attestation structure
    const isValid = await client.verifyAttestation(mockResponse.attestation);
    console.log('✓ Attestation structure valid:', isValid);
    
    return fieldProofs.length === 3 && merkleRoot.length === 64 && isValid;
  } catch (error) {
    console.error('✗ Mock TEE processing failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('=== Eigencompute Integration Tests ===\n');
  
  const results = {
    clientInit: await testClientInitialization(),
    proofStructure: await testProofStructure(),
    merkleTree: await testMerkleTree(),
    promptGen: await testPromptGeneration(),
    docHashing: await testDocumentHashing(),
    mockTEE: await testMockTEEProcessing(),
  };
  
  console.log('\n=== Test Results ===');
  console.log('Client Initialization:', results.clientInit ? '✓ PASS' : '✗ FAIL');
  console.log('Proof Structure:', results.proofStructure ? '✓ PASS' : '✗ FAIL');
  console.log('Merkle Tree:', results.merkleTree ? '✓ PASS' : '✗ FAIL');
  console.log('Prompt Generation:', results.promptGen ? '✓ PASS' : '✗ FAIL');
  console.log('Document Hashing:', results.docHashing ? '✓ PASS' : '✗ FAIL');
  console.log('Mock TEE Processing:', results.mockTEE ? '✓ PASS' : '✗ FAIL');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  
  console.log('\n=== Summary ===');
  console.log(`${passedTests}/${totalTests} tests passed`);
  
  return passedTests === totalTests;
}

/**
 * Integration test with real API (requires actual images and API keys)
 * This is commented out to prevent accidental API calls during development
 */
export async function testRealAPIIntegration() {
  console.log('\n⚠️ Real API Integration Test');
  console.log('This test requires:');
  console.log('  1. Valid ANTHROPIC_API_KEY in .env');
  console.log('  2. Valid EIGENCOMPUTE_API_KEY in .env');
  console.log('  3. Sample receipt/invoice image');
  console.log('\nTo run this test:');
  console.log('  1. Add sample images to /test-data/');
  console.log('  2. Uncomment the test code below');
  console.log('  3. Run: npm run test:integration\n');
  
  /*
  // Uncomment to run real API test
  const client = createEigencomputeClient();
  const fs = require('fs');
  
  // Load sample image
  const imagePath = './test-data/sample-receipt.jpg';
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');
  const docHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
  
  // Build prompt
  const prompt = buildExtractionPrompt('receipt');
  
  // Process through TEE
  const response = await client.processDocument({
    imageBase64,
    docHash,
    model: 'claude-sonnet-4.5-20241022',
    prompt,
  });
  
  console.log('Real API Response:');
  console.log('  Proof ID:', response.proofId);
  console.log('  Attestation ID:', response.attestation.attestationId);
  console.log('  Processing time:', response.metadata.processingTime, 'ms');
  console.log('  Extracted fields:', response.extractedData.fields.length);
  
  return true;
  */
}

// Export test suite
export const tests = {
  clientInit: testClientInitialization,
  proofStructure: testProofStructure,
  merkleTree: testMerkleTree,
  promptGen: testPromptGeneration,
  docHashing: testDocumentHashing,
  mockTEE: testMockTEEProcessing,
  runAll: runAllTests,
  realAPI: testRealAPIIntegration,
};

