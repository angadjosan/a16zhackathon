#!/usr/bin/env node

/**
 * API Endpoints Integration Tests
 * Tests all API routes created in Hour 3
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
// TEST SUITE 1: API Route Files Existence
// ============================================================================

async function testAPIRoutesExist() {
  logSection('TEST SUITE 1: API Route Files Existence');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    logTest('API-1.1', 'API route files exist');
    
    const requiredRoutes = [
      'src/app/api/extract/route.ts',
      'src/app/api/verify/route.ts',
      'src/app/api/proof/[docId]/route.ts',
      'src/app/api/documents/route.ts',
    ];
    
    let allRoutesExist = true;
    
    requiredRoutes.forEach(route => {
      const routePath = path.join(__dirname, '..', route);
      const exists = fs.existsSync(routePath);
      logInfo(`${exists ? '✓' : '✗'} ${route}`);
      if (!exists) allRoutesExist = false;
    });
    
    if (allRoutesExist) {
      logSuccess('All API route files exist');
      recordTest('API-1.1', 'API routes exist', true);
    } else {
      logError('Some API route files are missing');
      recordTest('API-1.1', 'API routes exist', false, 'Missing files');
    }
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    recordTest('API-1', 'API routes test suite', false, error.message);
  }
}

// ============================================================================
// TEST SUITE 2: Extract Endpoint Structure
// ============================================================================

async function testExtractEndpoint() {
  logSection('TEST SUITE 2: Extract Endpoint Structure');
  
  try {
    const fs = require('fs');
    const path = require('path');
    const extractPath = path.join(__dirname, '../src/app/api/extract/route.ts');
    
    logTest('API-2.1', 'Extract endpoint structure');
    
    if (fs.existsSync(extractPath)) {
      logSuccess('extract/route.ts file exists');
      
      const content = fs.readFileSync(extractPath, 'utf8');
      
      // Check for key components
      const hasPOST = content.includes('export async function POST');
      const hasGET = content.includes('export async function GET');
      const hasValidation = content.includes('ExtractRequestSchema');
      const hasZod = content.includes("from 'zod'");
      const usesExtractionService = content.includes('extractDocument');
      const usesDatabase = content.includes('database.storeCompleteDocumentProof');
      const hasErrorHandling = content.includes('try') && content.includes('catch');
      
      logInfo(`POST handler: ${hasPOST}`);
      logInfo(`GET handler (docs): ${hasGET}`);
      logInfo(`Request validation: ${hasValidation}`);
      logInfo(`Zod imported: ${hasZod}`);
      logInfo(`Uses extraction service: ${usesExtractionService}`);
      logInfo(`Uses database: ${usesDatabase}`);
      logInfo(`Error handling: ${hasErrorHandling}`);
      
      if (hasPOST && hasValidation && usesExtractionService && usesDatabase && hasErrorHandling) {
        logSuccess('Extract endpoint is properly structured');
        recordTest('API-2.1', 'Extract endpoint structure', true);
      } else {
        logError('Extract endpoint is missing some components');
        recordTest('API-2.1', 'Extract endpoint structure', false, 'Missing components');
      }
      
    } else {
      logError('extract/route.ts file not found');
      recordTest('API-2.1', 'Extract endpoint structure', false, 'File not found');
    }
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    recordTest('API-2', 'Extract endpoint test suite', false, error.message);
  }
}

// ============================================================================
// TEST SUITE 3: Verify Endpoint Structure
// ============================================================================

async function testVerifyEndpoint() {
  logSection('TEST SUITE 3: Verify Endpoint Structure');
  
  try {
    const fs = require('fs');
    const path = require('path');
    const verifyPath = path.join(__dirname, '../src/app/api/verify/route.ts');
    
    logTest('API-3.1', 'Verify endpoint structure');
    
    if (fs.existsSync(verifyPath)) {
      logSuccess('verify/route.ts file exists');
      
      const content = fs.readFileSync(verifyPath, 'utf8');
      
      // Check for key components
      const hasPOST = content.includes('export async function POST');
      const hasGET = content.includes('export async function GET');
      const hasValidation = content.includes('VerifyRequestSchema');
      const usesVerificationService = content.includes('verifyDocument');
      const usesDatabase = content.includes('database.getDocument');
      const hasProofRetrieval = content.includes('database.getProofMetadata');
      const hasErrorHandling = content.includes('try') && content.includes('catch');
      
      logInfo(`POST handler: ${hasPOST}`);
      logInfo(`GET handler (docs): ${hasGET}`);
      logInfo(`Request validation: ${hasValidation}`);
      logInfo(`Uses verification service: ${usesVerificationService}`);
      logInfo(`Uses database for retrieval: ${usesDatabase}`);
      logInfo(`Retrieves proof metadata: ${hasProofRetrieval}`);
      logInfo(`Error handling: ${hasErrorHandling}`);
      
      if (hasPOST && hasValidation && usesVerificationService && usesDatabase && hasErrorHandling) {
        logSuccess('Verify endpoint is properly structured');
        recordTest('API-3.1', 'Verify endpoint structure', true);
      } else {
        logError('Verify endpoint is missing some components');
        recordTest('API-3.1', 'Verify endpoint structure', false, 'Missing components');
      }
      
    } else {
      logError('verify/route.ts file not found');
      recordTest('API-3.1', 'Verify endpoint structure', false, 'File not found');
    }
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    recordTest('API-3', 'Verify endpoint test suite', false, error.message);
  }
}

// ============================================================================
// TEST SUITE 4: Proof Endpoint Structure
// ============================================================================

async function testProofEndpoint() {
  logSection('TEST SUITE 4: Proof Endpoint Structure');
  
  try {
    const fs = require('fs');
    const path = require('path');
    const proofPath = path.join(__dirname, '../src/app/api/proof/[docId]/route.ts');
    
    logTest('API-4.1', 'Proof endpoint structure');
    
    if (fs.existsSync(proofPath)) {
      logSuccess('proof/[docId]/route.ts file exists');
      
      const content = fs.readFileSync(proofPath, 'utf8');
      
      // Check for key components
      const hasGET = content.includes('export async function GET');
      const hasOPTIONS = content.includes('export async function OPTIONS');
      const hasRouteParams = content.includes('RouteParams');
      const hasUUIDValidation = content.includes('uuidRegex');
      const usesDatabase = content.includes('database.getCompleteDocumentProof');
      const hasFieldQuery = content.includes('field');
      const hasErrorHandling = content.includes('try') && content.includes('catch');
      
      logInfo(`GET handler: ${hasGET}`);
      logInfo(`OPTIONS handler (field query): ${hasOPTIONS}`);
      logInfo(`Route params interface: ${hasRouteParams}`);
      logInfo(`UUID validation: ${hasUUIDValidation}`);
      logInfo(`Uses database: ${usesDatabase}`);
      logInfo(`Field query support: ${hasFieldQuery}`);
      logInfo(`Error handling: ${hasErrorHandling}`);
      
      if (hasGET && hasRouteParams && hasUUIDValidation && usesDatabase && hasErrorHandling) {
        logSuccess('Proof endpoint is properly structured');
        recordTest('API-4.1', 'Proof endpoint structure', true);
      } else {
        logError('Proof endpoint is missing some components');
        recordTest('API-4.1', 'Proof endpoint structure', false, 'Missing components');
      }
      
    } else {
      logError('proof/[docId]/route.ts file not found');
      recordTest('API-4.1', 'Proof endpoint structure', false, 'File not found');
    }
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    recordTest('API-4', 'Proof endpoint test suite', false, error.message);
  }
}

// ============================================================================
// TEST SUITE 5: Documents Endpoint Structure
// ============================================================================

async function testDocumentsEndpoint() {
  logSection('TEST SUITE 5: Documents Endpoint Structure');
  
  try {
    const fs = require('fs');
    const path = require('path');
    const documentsPath = path.join(__dirname, '../src/app/api/documents/route.ts');
    
    logTest('API-5.1', 'Documents endpoint structure');
    
    if (fs.existsSync(documentsPath)) {
      logSuccess('documents/route.ts file exists');
      
      const content = fs.readFileSync(documentsPath, 'utf8');
      
      // Check for key components
      const hasGET = content.includes('export async function GET');
      const hasDELETE = content.includes('export async function DELETE');
      const hasOPTIONS = content.includes('export async function OPTIONS');
      const hasPagination = content.includes('page') && content.includes('limit');
      const hasFiltering = content.includes('documentType');
      const hasSorting = content.includes('sortBy') && content.includes('sortOrder');
      const usesDatabase = content.includes('database.listDocuments');
      const hasErrorHandling = content.includes('try') && content.includes('catch');
      
      logInfo(`GET handler: ${hasGET}`);
      logInfo(`DELETE handler (clear): ${hasDELETE}`);
      logInfo(`OPTIONS handler (docs): ${hasOPTIONS}`);
      logInfo(`Pagination support: ${hasPagination}`);
      logInfo(`Filtering support: ${hasFiltering}`);
      logInfo(`Sorting support: ${hasSorting}`);
      logInfo(`Uses database: ${usesDatabase}`);
      logInfo(`Error handling: ${hasErrorHandling}`);
      
      if (hasGET && hasPagination && hasFiltering && hasSorting && usesDatabase && hasErrorHandling) {
        logSuccess('Documents endpoint is properly structured');
        recordTest('API-5.1', 'Documents endpoint structure', true);
      } else {
        logError('Documents endpoint is missing some components');
        recordTest('API-5.1', 'Documents endpoint structure', false, 'Missing components');
      }
      
    } else {
      logError('documents/route.ts file not found');
      recordTest('API-5.1', 'Documents endpoint structure', false, 'File not found');
    }
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    recordTest('API-5', 'Documents endpoint test suite', false, error.message);
  }
}

// ============================================================================
// TEST SUITE 6: Integration Points
// ============================================================================

async function testIntegrationPoints() {
  logSection('TEST SUITE 6: Integration Points');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    logTest('API-6.1', 'API routes integrate with services');
    
    const routes = [
      { file: 'src/app/api/extract/route.ts', services: ['extractionService', 'database'] },
      { file: 'src/app/api/verify/route.ts', services: ['extractionService', 'database'] },
      { file: 'src/app/api/proof/[docId]/route.ts', services: ['database'] },
      { file: 'src/app/api/documents/route.ts', services: ['database'] },
    ];
    
    let allIntegrated = true;
    
    routes.forEach(route => {
      const routePath = path.join(__dirname, '..', route.file);
      
      if (fs.existsSync(routePath)) {
        const content = fs.readFileSync(routePath, 'utf8');
        
        const integrations = route.services.map(service => {
          const imported = content.includes(`from '@/${service.includes('Service') ? 'services' : 'lib'}/${service.replace('Service', 'Service')}'`);
          return { service, imported };
        });
        
        const allImported = integrations.every(i => i.imported);
        
        logInfo(`${allImported ? '✓' : '✗'} ${route.file}`);
        integrations.forEach(i => {
          logInfo(`  ${i.imported ? '✓' : '✗'} ${i.service}`);
        });
        
        if (!allImported) allIntegrated = false;
      } else {
        logInfo(`✗ ${route.file} (not found)`);
        allIntegrated = false;
      }
    });
    
    if (allIntegrated) {
      logSuccess('All API routes properly integrate with services');
      recordTest('API-6.1', 'Service integration', true);
    } else {
      logError('Some API routes have missing integrations');
      recordTest('API-6.1', 'Service integration', false, 'Missing integrations');
    }
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    recordTest('API-6', 'Integration points test suite', false, error.message);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║     TrustDocs Hour 3 API Endpoints Test Suite                   ║');
  console.log('║     Testing: API Routes Integration                             ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  // Run all test suites
  await testAPIRoutesExist();
  await testExtractEndpoint();
  await testVerifyEndpoint();
  await testProofEndpoint();
  await testDocumentsEndpoint();
  await testIntegrationPoints();
  
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
    console.log('\n🎉 ALL API TESTS PASSED! Hour 3 API implementation is complete.\n');
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

