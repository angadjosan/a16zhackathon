#!/usr/bin/env node

/**
 * Combined test runner for Angad's Hour 2 and Hour 3 test cases
 * Based on test-report.md specifications
 */

import { runHour2Tests } from './test-angad-hour2.js';
import { runHour3Tests } from './test-angad-hour3.js';

async function runAllAngadTests(): Promise<void> {
  console.log('🎯 Running All Tests for Angad (Hours 2 & 3)');
  console.log('='.repeat(80));
  console.log('Based on test cases from test-report.md');
  console.log('');
  
  try {
    // Run Hour 2 tests first
    console.log('📋 Starting Hour 2 Tests...\n');
    await runHour2Tests();
    
    console.log('\n🔄 Moving to Hour 3 Tests...\n');
    
    // Run Hour 3 tests
    await runHour3Tests();
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 All Angad tests completed successfully!');
    console.log('✅ Hour 2: Google Vision OCR Integration - PASSED');
    console.log('✅ Hour 3: Bounding Box Alignment - PASSED');
    console.log('');
    console.log('🚀 Ready for Hour 4 implementation!');
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    console.log('\n📋 Next steps:');
    console.log('1. Check error messages above');
    console.log('2. Verify environment variables are set');
    console.log('3. Ensure sample documents are present');
    console.log('4. Fix any implementation issues');
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllAngadTests();
}

export { runAllAngadTests };