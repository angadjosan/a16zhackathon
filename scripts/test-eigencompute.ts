#!/usr/bin/env ts-node
/**
 * Test Runner for Eigencompute Integration
 * 
 * Usage:
 *   npm run test:eigencompute
 *   or
 *   ts-node scripts/test-eigencompute.ts
 */

import { tests } from '../src/utils/__tests__/eigencompute.test';

async function main() {
  console.log('Starting Eigencompute Integration Tests...\n');
  
  try {
    const allPassed = await tests.runAll();
    
    if (allPassed) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. See above for details.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    process.exit(1);
  }
}

main();

