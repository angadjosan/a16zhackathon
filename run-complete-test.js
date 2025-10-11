#!/usr/bin/env node

/**
 * Complete Flow Test Runner
 * Runs the complete upload and verification flow test
 */

const { testCompleteFlow } = require('./test-complete-flow.js');

console.log('🚀 Starting Complete Flow Test');
console.log('Make sure your Next.js development server is running on http://localhost:3000');
console.log('');

// Check if server is running
fetch('http://localhost:3000/api/health')
  .then(response => {
    if (response.ok) {
      console.log('✅ Server is running, starting tests...\n');
      return testCompleteFlow();
    } else {
      throw new Error('Server not responding');
    }
  })
  .catch(error => {
    console.error('❌ Server not running or not accessible');
    console.error('Please start your Next.js development server with: npm run dev');
    console.error('Then run this test again.');
    process.exit(1);
  });
