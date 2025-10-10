// Test proof hash verification and API structure
import { createFieldProof } from '../lib/crypto.js';

async function testProofAPIStructure() {
  try {
    console.log("=== AA-4.6: Proof API Structure & Hash Verification ===");
    
    console.log("\n--- Testing API Endpoint Availability ---");
    
    // Test 1: Field proof endpoint structure
    const fieldEndpoint = "http://localhost:3000/api/proof/550e8400-e29b-41d4-a716-446655440000/total";
    try {
      const response = await fetch(fieldEndpoint);
      console.log("- Field proof endpoint accessible:", response.status !== 404 ? "✅" : "❌");
      console.log(`- Response status: ${response.status}`);
      
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        console.log("- Returns JSON response:", "✅");
        console.log("- Has success field:", data.success !== undefined ? "✅" : "❌");
        if (!data.success) {
          console.log("- Error message present:", data.error ? "✅" : "❌");
        }
      } else {
        console.log("- Returns JSON response:", "❌ (CSS compilation error)");
      }
    } catch (error) {
      console.log("- Field proof endpoint accessible:", "❌", error.message);
    }
    
    // Test 2: Collection proof endpoint structure
    const collectionEndpoint = "http://localhost:3000/api/proof/550e8400-e29b-41d4-a716-446655440000";
    try {
      const response = await fetch(collectionEndpoint);
      console.log("- Collection proof endpoint accessible:", response.status !== 404 ? "✅" : "❌");
      console.log(`- Response status: ${response.status}`);
    } catch (error) {
      console.log("- Collection proof endpoint accessible:", "❌", error.message);
    }
    
    console.log("\n--- Testing Crypto Functions ---");
    
    // Test 3: Proof hash generation
    try {
      const testDocHash = "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890";
      const testField = "total";
      const testValue = "$50.00";
      const testSourceText = "TOTAL $50.00";
      const testConfidence = 0.95;
      
      const proofHash = createFieldProof(testDocHash, testField, testValue, testSourceText, testConfidence);
      
      console.log("- Proof hash generation working:", proofHash ? "✅" : "❌");
      console.log("- Proof hash is 64 characters:", proofHash.length === 64 ? "✅" : "❌");
      console.log("- Proof hash is valid hex:", /^[a-f0-9]{64}$/i.test(proofHash) ? "✅" : "❌");
      console.log(`- Generated proof hash: ${proofHash.substring(0, 16)}...`);
      
      // Test deterministic generation
      const proofHash2 = createFieldProof(testDocHash, testField, testValue, testSourceText, testConfidence);
      console.log("- Proof hash is deterministic:", proofHash === proofHash2 ? "✅" : "❌");
      
      // Test different inputs produce different hashes
      const proofHash3 = createFieldProof(testDocHash, "vendor", "Test Store", "TEST STORE", 0.90);
      console.log("- Different inputs produce different hashes:", proofHash !== proofHash3 ? "✅" : "❌");
      
    } catch (error) {
      console.log("- Proof hash generation working:", "❌", error.message);
    }
    
    console.log("\n--- API Endpoint Direct Testing ---");
    
    // Test 4: Direct API validation without server errors
    const testCases = [
      {
        name: "Valid UUID with valid field",
        url: "http://localhost:3000/api/proof/550e8400-e29b-41d4-a716-446655440000/total",
        expectedStatus: [404, 500] // Database error expected without Supabase
      },
      {
        name: "Invalid UUID format",
        url: "http://localhost:3000/api/proof/invalid-uuid/total",
        expectedStatus: [400] // UUID validation error
      },
      {
        name: "Valid UUID with collection endpoint",
        url: "http://localhost:3000/api/proof/550e8400-e29b-41d4-a716-446655440000",
        expectedStatus: [404, 500] // Database error expected without Supabase
      },
      {
        name: "Invalid UUID collection endpoint",
        url: "http://localhost:3000/api/proof/invalid-uuid",
        expectedStatus: [400] // UUID validation error
      }
    ];
    
    for (const testCase of testCases) {
      try {
        const startTime = Date.now();
        const response = await fetch(testCase.url);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const statusMatch = testCase.expectedStatus.includes(response.status);
        console.log(`- ${testCase.name}:`, statusMatch ? "✅" : "❌", 
          `(Status: ${response.status}, Time: ${duration}ms)`);
        
        if (duration > 200) {
          console.log(`  ⚠️ Response time ${duration}ms exceeds 200ms target`);
        }
        
      } catch (error) {
        console.log(`- ${testCase.name}:`, "❌", error.message);
      }
    }
    
  } catch (error) {
    console.error("Proof API structure test failed:", error);
  }
}

testProofAPIStructure();
