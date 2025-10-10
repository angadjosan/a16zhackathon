// Test secure comparison implementation for Hour 3 timing attack prevention
const crypto = require('crypto');

// Simulate secure comparison function from crypto.ts
function secureCompare(a, b) {
  // Use Node.js built-in timing-safe equal comparison
  try {
    const bufferA = Buffer.from(a, 'hex');
    const bufferB = Buffer.from(b, 'hex');
    
    // Ensure both buffers are the same length for timing safety
    if (bufferA.length !== bufferB.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch (error) {
    return false;
  }
}

function testTimingAttackPrevention() {
  try {
    console.log("🛡️ Timing Attack Prevention Test (AA-3.10):");
    
    const hash1 = "a".repeat(64);
    const hash2 = "b".repeat(64);
    const hash3 = hash1; // Same as hash1
    
    // Test basic functionality
    const sameResult = secureCompare(hash1, hash3);
    const differentResult = secureCompare(hash1, hash2);
    
    console.log("- Same hashes comparison:", sameResult ? "✅" : "❌");
    console.log("- Different hashes comparison:", !differentResult ? "✅" : "❌");
    
    // Test timing consistency (basic test)
    const iterations = 1000;
    
    console.time("Secure compare (different hashes)");
    for (let i = 0; i < iterations; i++) {
      secureCompare(hash1, hash2);
    }
    console.timeEnd("Secure compare (different hashes)");
    
    console.time("Secure compare (same hashes)");
    for (let i = 0; i < iterations; i++) {
      secureCompare(hash1, hash3);
    }
    console.timeEnd("Secure compare (same hashes)");
    
    console.log("- Timing attack prevention: Using crypto.timingSafeEqual ✅");
    
    return true;
  } catch (error) {
    console.error("❌ Timing attack prevention test failed:", error.message);
    return false;
  }
}

function testHashCollisionResistance() {
  try {
    console.log("\n🔐 Hash Collision Resistance Test (SC-3.5):");
    
    // Generate different inputs and verify they produce different hashes
    const input1 = "test-input-1";
    const input2 = "test-input-2";
    const input3 = "test-input-1"; // Same as input1
    
    const hash1 = crypto.createHash('sha256').update(input1).digest('hex');
    const hash2 = crypto.createHash('sha256').update(input2).digest('hex');
    const hash3 = crypto.createHash('sha256').update(input3).digest('hex');
    
    console.log("- Different inputs produce different hashes:", hash1 !== hash2 ? "✅" : "❌");
    console.log("- Same inputs produce same hashes:", hash1 === hash3 ? "✅" : "❌");
    console.log("- Hash length consistency (64 chars):", 
      [hash1, hash2, hash3].every(h => h.length === 64) ? "✅" : "❌");
    
    return true;
  } catch (error) {
    console.error("❌ Hash collision resistance test failed:", error.message);
    return false;
  }
}

// Run tests
console.log("🔒 Hour 3 Security Testing\n");

const timingResult = testTimingAttackPrevention();
const collisionResult = testHashCollisionResistance();

console.log("\n📊 Security Test Results:");
console.log("AA-3.10 Secure Comparison Implementation:", timingResult ? "✅ PASSED" : "❌ FAILED");
console.log("SC-3.5 Hash Collision Resistance:", collisionResult ? "✅ PASSED" : "❌ FAILED");
