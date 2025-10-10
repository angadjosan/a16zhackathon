// Test proof API error handling
async function testProofAPIErrorHandling() {
  try {
    console.log("=== AA-4.3: Proof API Error Handling ===");
    
    // Test 1: Invalid UUID format
    console.log("\n--- Test 1: Invalid UUID Format ---");
    const invalidUuidResponse = await fetch("http://localhost:3001/api/proof/invalid-uuid/total");
    const invalidUuidData = await invalidUuidResponse.json();
    console.log("- Invalid UUID rejected:", 
      invalidUuidResponse.status === 400 && !invalidUuidData.success ? "✅" : "❌");
    console.log("- Error message for invalid UUID:", 
      invalidUuidData.error?.includes("Invalid document ID format") ? "✅" : "❌");
    console.log("- Response status:", invalidUuidResponse.status);
    console.log("- Error message:", invalidUuidData.error);
    
    // Test 2: Non-existent document
    console.log("\n--- Test 2: Non-existent Document ---");
    const nonExistentDocResponse = await fetch("http://localhost:3001/api/proof/00000000-0000-4000-8000-000000000000/total");
    const nonExistentDocData = await nonExistentDocResponse.json();
    console.log("- Non-existent document returns 404:", 
      nonExistentDocResponse.status === 404 && !nonExistentDocData.success ? "✅" : "❌");
    console.log("- Error message for missing document:", 
      nonExistentDocData.error?.includes("Document not found") || nonExistentDocData.error?.includes("Field proof not found") ? "✅" : "❌");
    console.log("- Response status:", nonExistentDocResponse.status);
    console.log("- Error message:", nonExistentDocData.error);
    
    // Test 3: Malformed request paths
    console.log("\n--- Test 3: Malformed Request Paths ---");
    const malformedResponse = await fetch("http://localhost:3001/api/proof/");
    console.log("- Malformed paths return appropriate errors:", 
      malformedResponse.status === 404 ? "✅" : "❌");
    console.log("- Response status:", malformedResponse.status);
    
    // Test 4: Different invalid UUID formats
    console.log("\n--- Test 4: Various Invalid UUID Formats ---");
    const invalidFormats = [
      "not-a-uuid",
      "12345678-1234-1234-1234-123456789012", // Wrong format
      "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "",
      "null"
    ];
    
    for (const invalidFormat of invalidFormats) {
      const response = await fetch(`http://localhost:3001/api/proof/${encodeURIComponent(invalidFormat)}/total`);
      const data = await response.json();
      console.log(`- Invalid UUID "${invalidFormat}" handled:`, 
        response.status === 400 ? "✅" : "❌");
    }
    
    // Test 5: Document collection endpoint error handling
    console.log("\n--- Test 5: Document Collection Error Handling ---");
    const collectionInvalidResponse = await fetch("http://localhost:3001/api/proof/invalid-uuid");
    const collectionInvalidData = await collectionInvalidResponse.json();
    console.log("- Collection endpoint rejects invalid UUID:", 
      collectionInvalidResponse.status === 400 && !collectionInvalidData.success ? "✅" : "❌");
    console.log("- Collection error message:", collectionInvalidData.error);
    
    // Test 6: Non-existent document collection
    const collectionNonExistentResponse = await fetch("http://localhost:3001/api/proof/00000000-0000-4000-8000-000000000000");
    const collectionNonExistentData = await collectionNonExistentResponse.json();
    console.log("- Collection endpoint handles non-existent document:", 
      collectionNonExistentResponse.status === 404 && !collectionNonExistentData.success ? "✅" : "❌");
    console.log("- Collection error message for missing doc:", collectionNonExistentData.error);
    
  } catch (error) {
    console.error("Proof API error handling test failed:", error);
  }
}

testProofAPIErrorHandling();
