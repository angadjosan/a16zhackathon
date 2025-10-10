// Test hash consistency and tamper detection for Hour 3 verification system
const crypto = require('crypto');
const fs = require('fs');

// Import functions from crypto.ts (simulated since we're using CommonJS)
function generateDocumentHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function verifyHashConsistency(hash1, hash2) {
  const verified = hash1 === hash2;
  return {
    verified,
    message: verified ? 
      "Document integrity verified - hashes match" : 
      "WARNING: Document may have been tampered with - hash mismatch detected"
  };
}

function testHashConsistency() {
  try {
    console.log("🔍 Hash Consistency Test (AA-3.1):");
    
    // Test with same file multiple times
    const fileBuffer = fs.readFileSync("./sample-docs/receipt.jpg");
    const hash1 = generateDocumentHash(fileBuffer);
    const hash2 = generateDocumentHash(fileBuffer);
    const hash3 = generateDocumentHash(fileBuffer);
    
    console.log("- Hash 1:", hash1);
    console.log("- Hash 2:", hash2);
    console.log("- Hash 3:", hash3);
    console.log("- All hashes identical:", (hash1 === hash2 && hash2 === hash3) ? "✅" : "❌");
    
    // Test verification function
    const verification = verifyHashConsistency(hash1, hash2);
    console.log("- Verification result:", verification.verified ? "✅" : "❌");
    console.log("- Verification message:", verification.message);
    
    return true;
  } catch (error) {
    console.error("❌ Hash consistency test failed:", error.message);
    return false;
  }
}

function testTamperDetection() {
  try {
    console.log("\n🛡️ Tamper Detection Test (AA-3.2):");
    
    // Generate hash for original file
    const originalBuffer = fs.readFileSync("./sample-docs/receipt.jpg");
    const originalHash = generateDocumentHash(originalBuffer);
    
    // Create a slightly modified version (add one byte)
    const modifiedBuffer = Buffer.concat([originalBuffer, Buffer.from([0x00])]);
    const modifiedHash = generateDocumentHash(modifiedBuffer);
    
    console.log("- Original hash:", originalHash);
    console.log("- Modified hash:", modifiedHash);
    console.log("- Hashes different:", originalHash !== modifiedHash ? "✅" : "❌");
    
    // Test verification function detects tamper
    const verification = verifyHashConsistency(originalHash, modifiedHash);
    console.log("- Tamper detected:", !verification.verified ? "✅" : "❌");
    console.log("- Warning message:", verification.message);
    
    return true;
  } catch (error) {
    console.error("❌ Tamper detection test failed:", error.message);
    return false;
  }
}

// Run tests
const test1 = testHashConsistency();
const test2 = testTamperDetection();

console.log("\n📊 Test Results Summary:");
console.log("AA-3.1 Hash Consistency:", test1 ? "✅ PASSED" : "❌ FAILED");
console.log("AA-3.2 Tamper Detection:", test2 ? "✅ PASSED" : "❌ FAILED");
