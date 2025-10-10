// Test proof API error handling - Updated for port 3000
async function testProofAPIErrorHandling() {
  try {
    console.log("=== AA-4.3: Proof API Error Handling ===");
    
    // Test 1: Invalid UUID format
    console.log("\n--- Test 1: Invalid UUID Format ---");
    const invalidUuidResponse = await fetch("http://localhost:3000/api/proof/invalid-uuid/total");
    const invalidUuidData = await invalidUuidResponse.json();
    console.log("- Invalid UUID rejected:", 
      invalidUuidResponse.status === 400 && !invalidUuidData.success ? "✅" : "❌");
    console.log("- Error message for invalid UUID:", 
      invalidUuidData.error?.includes("Invalid document ID format") ? "✅" : "❌");
    console.log("- Response status:", invalidUuidResponse.status);
    console.log("- Error message:", invalidUuidData.error);
    
    // Test 2: Non-existent document
    console.log("\n--- Test 2: Non-existent Document ---");
    const nonExistentDocResponse = await fetch("http://localhost:3000/api/proof/00000000-0000-4000-8000-000000000000/total");
    const nonExistentDocData = await nonExistentDocResponse.json();
    console.log("- Non-existent document handled:", 
      !nonExistentDocData.success ? "✅" : "❌");
    console.log("- Response status:", nonExistentDocResponse.status);
    console.log("- Error message:", nonExistentDocData.error);
    
    // Test 3: Different invalid UUID formats
    console.log("\n--- Test 3: Various Invalid UUID Formats ---");
    const invalidFormats = [
      "not-a-uuid",
      "12345678-1234-1234-1234-123456789012", // Wrong format
      "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "short",
      "null"
    ];
    
    for (const invalidFormat of invalidFormats) {
      const response = await fetch(`http://localhost:3000/api/proof/${encodeURIComponent(invalidFormat)}/total`);
      const data = await response.json();
      console.log(`- Invalid UUID "${invalidFormat}" handled:`, 
        response.status === 400 ? "✅" : "❌", `(Status: ${response.status})`);
    }
    
    // Test 4: Document collection endpoint error handling
    console.log("\n--- Test 4: Document Collection Error Handling ---");
    const collectionInvalidResponse = await fetch("http://localhost:3000/api/proof/invalid-uuid");
    const collectionInvalidData = await collectionInvalidResponse.json();
    console.log("- Collection endpoint rejects invalid UUID:", 
      collectionInvalidResponse.status === 400 && !collectionInvalidData.success ? "✅" : "❌");
    console.log("- Collection error message:", collectionInvalidData.error);
    
    // Test 5: Non-existent document collection
    const collectionNonExistentResponse = await fetch("http://localhost:3000/api/proof/00000000-0000-4000-8000-000000000000");
    const collectionNonExistentData = await collectionNonExistentResponse.json();
    console.log("- Collection endpoint handles non-existent document:", 
      !collectionNonExistentData.success ? "✅" : "❌");
    console.log("- Collection error message for missing doc:", collectionNonExistentData.error);
    
    // Test 6: Empty field name
    console.log("\n--- Test 5: Edge Cases ---");
    const emptyFieldResponse = await fetch("http://localhost:3000/api/proof/00000000-0000-4000-8000-000000000000/");
    console.log("- Empty field name handled:", 
      emptyFieldResponse.status === 404 ? "✅" : "❌", `(Status: ${emptyFieldResponse.status})`);
    
  } catch (error) {
    console.error("Proof API error handling test failed:", error);
  }
}

testProofAPIErrorHandling();
