import { generateDocumentHash, verifyHashConsistency } from "../lib/crypto";
import fs from "fs";

function testHashConsistency() {
  try {
    // Test with same file multiple times
    const fileBuffer = fs.readFileSync("./sample-docs/receipt.jpg");
    const hash1 = generateDocumentHash(fileBuffer);
    const hash2 = generateDocumentHash(fileBuffer);
    const hash3 = generateDocumentHash(fileBuffer);
    
    console.log("Hash Consistency Test:");
    console.log("- Hash 1:", hash1);
    console.log("- Hash 2:", hash2);
    console.log("- Hash 3:", hash3);
    console.log("- All hashes identical:", (hash1 === hash2 && hash2 === hash3) ? "✅" : "❌");
    
    // Test verification function
    const verification = verifyHashConsistency(hash1, hash2);
    console.log("- Verification result:", verification.verified ? "✅" : "❌");
    console.log("- Verification message:", verification.message);
    
  } catch (error) {
    console.error("Hash consistency test failed:", error);
  }
}

testHashConsistency();
