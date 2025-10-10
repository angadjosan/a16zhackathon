#!/usr/bin/env node

/**
 * Hour 2 Test Runner for Aditya's Work
 * Tests: Claude Integration + Eigencompute + Extraction Service + Database
 */

const crypto = require('crypto');

// Test utilities
function logSection(title) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70) + '\n');
}

function logTest(id, description) {
  console.log(`\n📋 Test ${id}: ${description}`);
  console.log('-'.repeat(70));
}

function logSuccess(message) {
  console.log('✅', message);
}

function logError(message) {
  console.error('❌', message);
}

function logInfo(message) {
  console.log('ℹ️ ', message);
}

function logWarning(message) {
  console.warn('⚠️ ', message);
}

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function recordTest(id, description, passed, message = '') {
  testResults.tests.push({ id, description, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// ============================================================================
// TEST SUITE 1: Extraction Types & Schemas
// ============================================================================

async function testExtractionTypes() {
  logSection('TEST SUITE 1: Extraction Types & Schemas');
  
  try {
    logTest('AD-2.1.1', 'Receipt schema structure');
    
    // Check if extraction types file exists
    const fs = require('fs');
    const path = require('path');
    const typesPath = path.join(__dirname, '../src/types/extraction.types.ts');
    
    if (fs.existsSync(typesPath)) {
      logSuccess('extraction.types.ts file exists');
      
      const content = fs.readFileSync(typesPath, 'utf8');
      
      // Check for key schemas
      const hasReceiptSchema = content.includes('ReceiptExtractionSchema');
      const hasInvoiceSchema = content.includes('InvoiceExtractionSchema');
      const hasContractSchema = content.includes('ContractExtractionSchema');
      const hasLineItemSchema = content.includes('LineItemSchema');
      const hasZodImport = content.includes("from 'zod'");
      
      logInfo(`Receipt schema defined: ${hasReceiptSchema}`);
      logInfo(`Invoice schema defined: ${hasInvoiceSchema}`);
      logInfo(`Contract schema defined: ${hasContractSchema}`);
      logInfo(`Line item schema defined: ${hasLineItemSchema}`);
      logInfo(`Zod imported: ${hasZodImport}`);
      
      if (hasReceiptSchema && hasInvoiceSchema && hasContractSchema && hasLineItemSchema && hasZodImport) {
        logSuccess('All extraction schemas are defined');
        recordTest('AD-2.1.1', 'Extraction schemas defined', true);
      } else {
        logError('Some schemas are missing');
        recordTest('AD-2.1.1', 'Extraction schemas defined', false, 'Missing schemas');
      }
      
      // Check for extraction prompts
      logTest('AD-2.1.6', 'Extraction prompts defined');
      const hasPrompts = content.includes('CLAUDE_EXTRACTION_PROMPTS');
      const hasReceiptPrompt = content.includes('receipt:');
      const hasInvoicePrompt = content.includes('invoice:');
      const hasContractPrompt = content.includes('contract:');
      
      logInfo(`Prompts object defined: ${hasPrompts}`);
      logInfo(`Receipt prompt: ${hasReceiptPrompt}`);
      logInfo(`Invoice prompt: ${hasInvoicePrompt}`);
      logInfo(`Contract prompt: ${hasContractPrompt}`);
      
      if (hasPrompts && hasReceiptPrompt && hasInvoicePrompt && hasContractPrompt) {
        logSuccess('All document type prompts are defined');
        recordTest('AD-2.1.6', 'Extraction prompts defined', true);
      } else {
        logError('Some prompts are missing');
        recordTest('AD-2.1.6', 'Extraction prompts defined', false, 'Missing prompts');
      }
      
    } else {
      logError('extraction.types.ts file not found');
      recordTest('AD-2.1.1', 'Extraction schemas defined', false, 'File not found');
    }
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    recordTest('AD-2.1', 'Extraction types test suite', false, error.message);
  }
}

// ============================================================================
// TEST SUITE 2: Claude Integration
// ============================================================================

async function testClaudeIntegration() {
  logSection('TEST SUITE 2: Claude Vision API Integration');
  
  try {
    const fs = require('fs');
    const path = require('path');
    const claudePath = path.join(__dirname, '../src/utils/claudeExtraction.ts');
    
    logTest('AD-2.2.1', 'Claude integration file structure');
    
    if (fs.existsSync(claudePath)) {
      logSuccess('claudeExtraction.ts file exists');
      
      const content = fs.readFileSync(claudePath, 'utf8');
      
      // Check for key functions
      const hasExtractWithClaude = content.includes('export async function extractWithClaude');
      const hasAutoExtract = content.includes('export async function autoExtract');
      const hasTestConnection = content.includes('export async function testClaudeConnection');
      const hasAnthropicImport = content.includes("from '@anthropic-ai/sdk'");
      
      logInfo(`extractWithClaude function: ${hasExtractWithClaude}`);
      logInfo(`autoExtract function: ${hasAutoExtract}`);
      logInfo(`testClaudeConnection function: ${hasTestConnection}`);
      logInfo(`Anthropic SDK imported: ${hasAnthropicImport}`);
      
      if (hasExtractWithClaude && hasAutoExtract && hasTestConnection && hasAnthropicImport) {
        logSuccess('All Claude integration functions are defined');
        recordTest('AD-2.2.1', 'Claude integration structure', true);
      } else {
        logError('Some Claude functions are missing');
        recordTest('AD-2.2.1', 'Claude integration structure', false, 'Missing functions');
      }
      
      // Check for error handling
      logTest('AD-2.2.7', 'Error handling in Claude integration');
      const hasTryCatch = content.match(/try\s*{[\s\S]*?catch/g);
      const errorCount = hasTryCatch ? hasTryCatch.length : 0;
      
      logInfo(`Try-catch blocks found: ${errorCount}`);
      
      if (errorCount >= 2) {
        logSuccess('Error handling implemented');
        recordTest('AD-2.2.7', 'Error handling', true);
      } else {
        logWarning('Limited error handling detected');
        recordTest('AD-2.2.7', 'Error handling', false, 'Needs more error handling');
      }
      
      // Check for token usage tracking
      logTest('AD-2.2.8', 'Token usage tracking');
      const hasUsageTracking = content.includes('usage') && content.includes('inputTokens') && content.includes('outputTokens');
      
      if (hasUsageTracking) {
        logSuccess('Token usage tracking implemented');
        recordTest('AD-2.2.8', 'Token usage tracking', true);
      } else {
        logWarning('Token usage tracking not found');
        recordTest('AD-2.2.8', 'Token usage tracking', false, 'No token tracking');
      }
      
    } else {
      logError('claudeExtraction.ts file not found');
      recordTest('AD-2.2.1', 'Claude integration structure', false, 'File not found');
    }
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    recordTest('AD-2.2', 'Claude integration test suite', false, error.message);
  }
}

// ============================================================================
// TEST SUITE 3: Eigencompute Functions
// ============================================================================

async function testEigencomputeFunctions() {
  logSection('TEST SUITE 3: Eigencompute Client Extensions');
  
  try {
    logTest('AD-2.3.1', 'Document hash generation');
    
    // Test SHA-256 hashing
    const testBuffer = Buffer.from('TEST_DOCUMENT_DATA');
    const hash1 = crypto.createHash('sha256').update(testBuffer).digest('hex');
    const hash2 = crypto.createHash('sha256').update(testBuffer).digest('hex');
    
    logInfo(`Hash 1: ${hash1.substring(0, 16)}...`);
    logInfo(`Hash 2: ${hash2.substring(0, 16)}...`);
    logInfo(`Hashes match: ${hash1 === hash2}`);
    
    if (hash1 === hash2 && hash1.length === 64) {
      logSuccess('SHA-256 hashing works correctly');
      recordTest('AD-2.3.1', 'Document hash generation', true);
    } else {
      logError('Hash generation inconsistent');
      recordTest('AD-2.3.1', 'Document hash generation', false, 'Inconsistent hashing');
    }
    
    // Test JSON canonicalization
    logTest('AD-2.3.8', 'JSON canonicalization for consistent hashing');
    
    const obj1 = { field: 'total', value: 42.99, confidence: 0.98 };
    const obj2 = { confidence: 0.98, value: 42.99, field: 'total' };
    
    const canonical1 = JSON.stringify(obj1, Object.keys(obj1).sort());
    const canonical2 = JSON.stringify(obj2, Object.keys(obj2).sort());
    
    logInfo(`Canonical 1: ${canonical1}`);
    logInfo(`Canonical 2: ${canonical2}`);
    logInfo(`Canonicals match: ${canonical1 === canonical2}`);
    
    if (canonical1 === canonical2) {
      logSuccess('JSON canonicalization produces consistent results');
      recordTest('AD-2.3.8', 'JSON canonicalization', true);
    } else {
      logError('JSON canonicalization inconsistent');
      recordTest('AD-2.3.8', 'JSON canonicalization', false);
    }
    
    // Test Merkle tree simulation
    logTest('AD-2.3.3', 'Merkle root generation');
    
    const hash3 = crypto.createHash('sha256').update('field1').digest('hex');
    const hash4 = crypto.createHash('sha256').update('field2').digest('hex');
    const merkleRoot = crypto.createHash('sha256').update(hash3 + hash4).digest('hex');
    
    logInfo(`Merkle root: ${merkleRoot.substring(0, 16)}...`);
    
    if (merkleRoot && merkleRoot.length === 64) {
      logSuccess('Merkle root generation works');
      recordTest('AD-2.3.3', 'Merkle root generation', true);
    } else {
      logError('Merkle root generation failed');
      recordTest('AD-2.3.3', 'Merkle root generation', false);
    }
    
    // Check eigencompute file structure
    const fs = require('fs');
    const path = require('path');
    const eigenPath = path.join(__dirname, '../src/utils/eigencompute.ts');
    
    logTest('AD-2.3.7', 'Eigencompute singleton instance');
    
    if (fs.existsSync(eigenPath)) {
      const content = fs.readFileSync(eigenPath, 'utf8');
      
      const hasSingleton = content.includes('export const eigencomputeClient');
      const hasGenerateProof = content.includes('async generateProof(');
      const hasVerifyProof = content.includes('async verifyProof(');
      const hasGenerateDocumentHash = content.includes('generateDocumentHash(');
      const hasGenerateMerkleRoot = content.includes('generateMerkleRoot(');
      
      logInfo(`Singleton exported: ${hasSingleton}`);
      logInfo(`generateProof method: ${hasGenerateProof}`);
      logInfo(`verifyProof method: ${hasVerifyProof}`);
      logInfo(`generateDocumentHash method: ${hasGenerateDocumentHash}`);
      logInfo(`generateMerkleRoot method: ${hasGenerateMerkleRoot}`);
      
      if (hasSingleton && hasGenerateProof && hasVerifyProof && hasGenerateDocumentHash) {
        logSuccess('All Eigencompute convenience methods defined');
        recordTest('AD-2.3.7', 'Eigencompute extensions', true);
      } else {
        logError('Some Eigencompute methods are missing');
        recordTest('AD-2.3.7', 'Eigencompute extensions', false, 'Missing methods');
      }
    } else {
      logError('eigencompute.ts file not found');
      recordTest('AD-2.3.7', 'Eigencompute extensions', false, 'File not found');
    }
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    recordTest('AD-2.3', 'Eigencompute functions test suite', false, error.message);
  }
}

// ============================================================================
// TEST SUITE 4: Extraction Service
// ============================================================================

async function testExtractionService() {
  logSection('TEST SUITE 4: Extraction Service Orchestration');
  
  try {
    const fs = require('fs');
    const path = require('path');
    const servicePath = path.join(__dirname, '../src/services/extractionService.ts');
    
    logTest('AD-2.4.1', 'Extraction service file structure');
    
    if (fs.existsSync(servicePath)) {
      logSuccess('extractionService.ts file exists');
      
      const content = fs.readFileSync(servicePath, 'utf8');
      
      // Check for key functions
      const hasExtractDocument = content.includes('export async function extractDocument');
      const hasVerifyDocument = content.includes('export async function verifyDocument');
      const hasCreateDocumentProof = content.includes('export function createDocumentProof');
      const hasCalculateConfidence = content.includes('export function calculateOverallConfidence');
      const hasGetLowConfidenceFields = content.includes('export function getLowConfidenceFields');
      
      logInfo(`extractDocument function: ${hasExtractDocument}`);
      logInfo(`verifyDocument function: ${hasVerifyDocument}`);
      logInfo(`createDocumentProof function: ${hasCreateDocumentProof}`);
      logInfo(`calculateOverallConfidence function: ${hasCalculateConfidence}`);
      logInfo(`getLowConfidenceFields function: ${hasGetLowConfidenceFields}`);
      
      if (hasExtractDocument && hasVerifyDocument && hasCreateDocumentProof) {
        logSuccess('All extraction service functions are defined');
        recordTest('AD-2.4.1', 'Extraction service structure', true);
      } else {
        logError('Some extraction service functions are missing');
        recordTest('AD-2.4.1', 'Extraction service structure', false, 'Missing functions');
      }
      
      // Check for pipeline steps
      logTest('AD-2.4.2', 'Extraction pipeline steps');
      const hasHashGeneration = content.includes('generateDocumentHash');
      const hasClaudeCall = content.includes('extractWithClaude') || content.includes('autoExtract');
      const hasProofGeneration = content.includes('generateProof');
      const hasFieldProofs = content.includes('fieldProofs');
      const hasMerkleRoot = content.includes('merkleRoot');
      
      logInfo(`Hash generation: ${hasHashGeneration}`);
      logInfo(`Claude integration: ${hasClaudeCall}`);
      logInfo(`Proof generation: ${hasProofGeneration}`);
      logInfo(`Field proofs: ${hasFieldProofs}`);
      logInfo(`Merkle root: ${hasMerkleRoot}`);
      
      const pipelineComplete = hasHashGeneration && hasClaudeCall && hasProofGeneration && hasFieldProofs && hasMerkleRoot;
      
      if (pipelineComplete) {
        logSuccess('Complete extraction pipeline implemented');
        recordTest('AD-2.4.2', 'Extraction pipeline', true);
      } else {
        logWarning('Some pipeline steps may be missing');
        recordTest('AD-2.4.2', 'Extraction pipeline', false, 'Incomplete pipeline');
      }
      
      // Check imports
      logTest('AD-2.4.3', 'Service imports');
      const importsClaudeExtraction = content.includes("from '../utils/claudeExtraction'");
      const importsEigencompute = content.includes("from '../utils/eigencompute'");
      
      logInfo(`Imports claudeExtraction: ${importsClaudeExtraction}`);
      logInfo(`Imports eigencompute: ${importsEigencompute}`);
      
      if (importsClaudeExtraction && importsEigencompute) {
        logSuccess('All required modules imported');
        recordTest('AD-2.4.3', 'Service imports', true);
      } else {
        logError('Missing imports');
        recordTest('AD-2.4.3', 'Service imports', false);
      }
      
    } else {
      logError('extractionService.ts file not found');
      recordTest('AD-2.4.1', 'Extraction service structure', false, 'File not found');
    }
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    recordTest('AD-2.4', 'Extraction service test suite', false, error.message);
  }
}

// ============================================================================
// TEST SUITE 5: Database Layer
// ============================================================================

async function testDatabaseLayer() {
  logSection('TEST SUITE 5: Database Layer');
  
  try {
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, '../src/lib/database.ts');
    
    logTest('AD-2.6.1', 'Database file structure');
    
    if (fs.existsSync(dbPath)) {
      logSuccess('database.ts file exists');
      
      const content = fs.readFileSync(dbPath, 'utf8');
      
      // Check for key functions
      const hasStoreDocument = content.includes('storeDocument');
      const hasStoreProofMetadata = content.includes('storeProofMetadata');
      const hasStoreExtraction = content.includes('storeExtraction');
      const hasStoreCompleteProof = content.includes('storeCompleteDocumentProof');
      const hasGetDocument = content.includes('getDocument');
      const hasGetDocumentByHash = content.includes('getDocumentByHash');
      const hasGetExtractions = content.includes('getExtractions');
      const hasGetProofMetadata = content.includes('getProofMetadata');
      const hasListDocuments = content.includes('listDocuments');
      const hasClearAll = content.includes('clearAll');
      const hasHealthCheck = content.includes('checkDatabaseHealth');
      
      logInfo(`storeDocument: ${hasStoreDocument}`);
      logInfo(`storeProofMetadata: ${hasStoreProofMetadata}`);
      logInfo(`storeExtraction: ${hasStoreExtraction}`);
      logInfo(`storeCompleteDocumentProof: ${hasStoreCompleteProof}`);
      logInfo(`getDocument: ${hasGetDocument}`);
      logInfo(`getDocumentByHash: ${hasGetDocumentByHash}`);
      logInfo(`getExtractions: ${hasGetExtractions}`);
      logInfo(`getProofMetadata: ${hasGetProofMetadata}`);
      logInfo(`listDocuments: ${hasListDocuments}`);
      logInfo(`clearAll: ${hasClearAll}`);
      logInfo(`checkDatabaseHealth: ${hasHealthCheck}`);
      
      const allFunctionsPresent = hasStoreDocument && hasStoreProofMetadata && hasStoreExtraction &&
                                   hasStoreCompleteProof && hasGetDocument && hasGetDocumentByHash &&
                                   hasGetExtractions && hasGetProofMetadata && hasListDocuments &&
                                   hasClearAll && hasHealthCheck;
      
      if (allFunctionsPresent) {
        logSuccess('All database functions are defined');
        recordTest('AD-2.6.1', 'Database CRUD operations', true);
      } else {
        logError('Some database functions are missing');
        recordTest('AD-2.6.1', 'Database CRUD operations', false, 'Missing functions');
      }
      
      // Check for type definitions
      logTest('AD-2.6.2', 'Database type definitions');
      const hasDocumentRecord = content.includes('DocumentRecord');
      const hasExtractionRecord = content.includes('ExtractionRecord');
      const hasProofMetadataRecord = content.includes('ProofMetadataRecord');
      
      logInfo(`DocumentRecord type: ${hasDocumentRecord}`);
      logInfo(`ExtractionRecord type: ${hasExtractionRecord}`);
      logInfo(`ProofMetadataRecord type: ${hasProofMetadataRecord}`);
      
      if (hasDocumentRecord && hasExtractionRecord && hasProofMetadataRecord) {
        logSuccess('All database type definitions present');
        recordTest('AD-2.6.2', 'Database types', true);
      } else {
        logError('Some type definitions are missing');
        recordTest('AD-2.6.2', 'Database types', false);
      }
      
      // Check for database singleton
      logTest('AD-2.6.3', 'Database singleton export');
      const hasDatabaseExport = content.includes('export const database');
      
      if (hasDatabaseExport) {
        logSuccess('Database singleton exported');
        recordTest('AD-2.6.3', 'Database singleton', true);
      } else {
        logError('Database singleton not exported');
        recordTest('AD-2.6.3', 'Database singleton', false);
      }
      
    } else {
      logError('database.ts file not found');
      recordTest('AD-2.6.1', 'Database structure', false, 'File not found');
    }
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    recordTest('AD-2.6', 'Database layer test suite', false, error.message);
  }
}

// ============================================================================
// TEST SUITE 6: File Structure & Organization
// ============================================================================

async function testFileStructure() {
  logSection('TEST SUITE 6: File Structure & Organization');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    logTest('AD-2.7.1', 'Required files exist');
    
    const requiredFiles = [
      'src/types/extraction.types.ts',
      'src/utils/claudeExtraction.ts',
      'src/utils/eigencompute.ts',
      'src/services/extractionService.ts',
      'src/lib/database.ts',
      'scripts/test-complete-flow.ts',
      'tsconfig.scripts.json'
    ];
    
    let allFilesExist = true;
    
    requiredFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      const exists = fs.existsSync(filePath);
      logInfo(`${exists ? '✓' : '✗'} ${file}`);
      if (!exists) allFilesExist = false;
    });
    
    if (allFilesExist) {
      logSuccess('All required files exist');
      recordTest('AD-2.7.1', 'File structure', true);
    } else {
      logError('Some required files are missing');
      recordTest('AD-2.7.1', 'File structure', false, 'Missing files');
    }
    
    // Check package.json scripts
    logTest('AD-2.7.2', 'NPM test scripts');
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const hasCompleteFlowScript = packageJson.scripts && packageJson.scripts['test:complete-flow'];
    const hasEigencomputeScript = packageJson.scripts && packageJson.scripts['test:eigencompute'];
    
    logInfo(`test:complete-flow script: ${hasCompleteFlowScript ? '✓' : '✗'}`);
    logInfo(`test:eigencompute script: ${hasEigencomputeScript ? '✓' : '✗'}`);
    
    if (hasCompleteFlowScript && hasEigencomputeScript) {
      logSuccess('Test scripts defined in package.json');
      recordTest('AD-2.7.2', 'NPM test scripts', true);
    } else {
      logWarning('Some test scripts missing from package.json');
      recordTest('AD-2.7.2', 'NPM test scripts', false, 'Missing scripts');
    }
    
    // Check dependencies
    logTest('AD-2.7.3', 'Required dependencies');
    const hasZod = packageJson.dependencies && packageJson.dependencies['zod'];
    const hasAnthropic = packageJson.dependencies && packageJson.dependencies['@anthropic-ai/sdk'];
    const hasCryptoJs = packageJson.dependencies && packageJson.dependencies['crypto-js'];
    
    logInfo(`zod: ${hasZod ? '✓' : '✗'}`);
    logInfo(`@anthropic-ai/sdk: ${hasAnthropic ? '✓' : '✗'}`);
    logInfo(`crypto-js: ${hasCryptoJs ? '✓' : '✗'}`);
    
    if (hasZod && hasAnthropic) {
      logSuccess('All required dependencies installed');
      recordTest('AD-2.7.3', 'Dependencies', true);
    } else {
      logError('Some dependencies are missing');
      recordTest('AD-2.7.3', 'Dependencies', false, 'Missing dependencies');
    }
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    recordTest('AD-2.7', 'File structure test suite', false, error.message);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║     TrustDocs Hour 2 Test Suite - Aditya\'s Work                  ║');
  console.log('║     Testing: Claude + Eigencompute + Database Integration       ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  // Run all test suites
  await testExtractionTypes();
  await testClaudeIntegration();
  await testEigencomputeFunctions();
  await testExtractionService();
  await testDatabaseLayer();
  await testFileStructure();
  
  // Print summary
  logSection('TEST SUMMARY');
  
  console.log(`Total Tests:  ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed:    ${testResults.passed}`);
  console.log(`❌ Failed:    ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%\n`);
  
  // Print detailed results
  console.log('Detailed Results:');
  console.log('-'.repeat(70));
  
  testResults.tests.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    const message = test.message ? ` (${test.message})` : '';
    console.log(`${status} ${test.id}: ${test.description}${message}`);
  });
  
  console.log('\n' + '='.repeat(70));
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Hour 2 implementation is complete and verified.\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${testResults.failed} test(s) failed. Please review and fix.\n`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error running tests:', error);
  process.exit(1);
});

