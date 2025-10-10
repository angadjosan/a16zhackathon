// Test UUID validation in proof APIs
async function testUUIDValidation() {
  try {
    console.log("=== AA-4.4: UUID Validation in Proof APIs ===");
    
    console.log("\n--- Valid UUID Format Tests ---");
    
    // Test with various valid UUID formats
    const validUuids = [
      "550e8400-e29b-41d4-a716-446655440000", // Version 4 UUID
      "6ba7b810-9dad-11d1-80b4-00c04fd430c8", // Version 1 UUID  
      "00000000-0000-4000-8000-000000000000", // Nil UUID (valid format)
      "123e4567-e89b-12d3-a456-426614174000"  // Another valid UUID
    ];
    
    console.log("Testing field-level proof endpoints with valid UUIDs:");
    for (const uuid of validUuids) {
      const response = await fetch(`http://localhost:3000/api/proof/${uuid}/total`);
      const data = await response.json();
      
      // Should pass UUID validation (even if document doesn't exist)
      const passesValidation = response.status !== 400 || !data.error?.includes("Invalid document ID format");
      console.log(`- UUID "${uuid.substring(0, 8)}..." passes validation:`, 
        passesValidation ? "✅" : "❌", `(Status: ${response.status})`);
    }
    
    console.log("\nTesting document collection endpoints with valid UUIDs:");
    for (const uuid of validUuids) {
      const response = await fetch(`http://localhost:3000/api/proof/${uuid}`);
      const data = await response.json();
      
      // Should pass UUID validation (even if document doesn't exist)
      const passesValidation = response.status !== 400 || !data.error?.includes("Invalid document ID format");
      console.log(`- UUID "${uuid.substring(0, 8)}..." passes validation:`, 
        passesValidation ? "✅" : "❌", `(Status: ${response.status})`);
    }
    
    console.log("\n--- Invalid UUID Rejection Tests ---");
    
    const invalidUuids = [
      "not-a-uuid-at-all",
      "123456789012345678901234567890123456", // Too long
      "123-456-789", // Wrong format
      "g50e8400-e29b-41d4-a716-446655440000", // Invalid character
      "550e8400-e29b-41d4-a716", // Too short
      "", // Empty
      " ", // Space
      "null", // String "null"
      "undefined" // String "undefined"
    ];
    
    console.log("Testing field-level proof endpoints with invalid UUIDs:");
    for (const uuid of invalidUuids) {
      const response = await fetch(`http://localhost:3000/api/proof/${encodeURIComponent(uuid)}/total`);
      const data = await response.json();
      
      const properlyRejected = response.status === 400 && data.error?.includes("Invalid document ID format");
      console.log(`- Invalid UUID "${uuid.substring(0, 15)}..." properly rejected:`, 
        properlyRejected ? "✅" : "❌", `(Status: ${response.status})`);
    }
    
    console.log("\nTesting document collection endpoints with invalid UUIDs:");
    for (const uuid of invalidUuids) {
      const response = await fetch(`http://localhost:3000/api/proof/${encodeURIComponent(uuid)}`);
      const data = await response.json();
      
      const properlyRejected = response.status === 400 && data.error?.includes("Invalid document ID format");
      console.log(`- Invalid UUID "${uuid.substring(0, 15)}..." properly rejected:`, 
        properlyRejected ? "✅" : "❌", `(Status: ${response.status})`);
    }
    
    console.log("\n--- Security Test: SQL Injection Attempts ---");
    
    const sqlInjectionAttempts = [
      "'; DROP TABLE proofs; --",
      "' OR 1=1 --",
      "UNION SELECT * FROM documents",
      "../../../etc/passwd"
    ];
    
    for (const injection of sqlInjectionAttempts) {
      const response = await fetch(`http://localhost:3000/api/proof/${encodeURIComponent(injection)}/total`);
      const data = await response.json();
      
      const handledSecurely = response.status === 400 && data.error?.includes("Invalid document ID format");
      console.log(`- SQL injection "${injection.substring(0, 20)}..." handled securely:`, 
        handledSecurely ? "✅" : "❌");
    }
    
  } catch (error) {
    console.error("UUID validation test failed:", error);
  }
}

testUUIDValidation();
