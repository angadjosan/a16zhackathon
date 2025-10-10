// Test individual field proof retrieval
async function testFieldProofRetrieval() {
  try {
    console.log("=== AA-4.1: Field-level proof retrieval API ===");
    
    // First, upload and extract a document to get proof data
    const formData = new FormData();
    const testFile = new File(["test receipt data"], "test-receipt.jpg", {type: "image/jpeg"});
    formData.append("file", testFile);
    
    const uploadResponse = await fetch("http://localhost:3001/api/upload", {
      method: "POST",
      body: formData
    });
    const uploadData = await uploadResponse.json();
    console.log("Upload response:", uploadData.success ? "✅" : "❌");
    
    if (!uploadData.success) {
      console.error("Upload failed:", uploadData.error);
      return;
    }
    
    const docId = uploadData.data.fileId;
    console.log("Document ID:", docId);
    
    // Trigger extraction to generate proofs
    const extractResponse = await fetch("http://localhost:3001/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: docId })
    });
    const extractData = await extractResponse.json();
    console.log("Extract response:", extractResponse.ok ? "✅" : "❌");
    
    if (!extractData.success) {
      console.error("Extract failed:", extractData.error);
      return;
    }
    
    // Test field proof retrieval for 'total' field
    const proofResponse = await fetch(`http://localhost:3001/api/proof/${docId}/total`);
    const proofData = await proofResponse.json();
    
    console.log("\n--- Field Proof Retrieval Test Results ---");
    console.log("- API responds successfully:", proofResponse.ok ? "✅" : "❌");
    console.log("- Response has success field:", proofData.success !== undefined ? "✅" : "❌");
    console.log("- Proof hash present:", proofData.data?.proof_hash ? "✅" : "❌");
    console.log("- Field name matches:", proofData.data?.field === "total" ? "✅" : "❌");
    console.log("- Confidence score included:", proofData.data?.confidence !== undefined ? "✅" : "❌");
    console.log("- Document hash included:", proofData.data?.document_hash ? "✅" : "❌");
    console.log("- Bounding box data present:", proofData.data?.bounding_box ? "✅" : "❌");
    console.log("- Verification status valid:", ["verified", "pending", "failed"].includes(proofData.data?.verification_status) ? "✅" : "❌");
    
    if (proofData.data) {
      console.log("\n--- Proof Data Details ---");
      console.log("Field:", proofData.data.field);
      console.log("Value:", proofData.data.value);
      console.log("Confidence:", proofData.data.confidence);
      console.log("Proof Hash:", proofData.data.proof_hash?.substring(0, 16) + "...");
      console.log("Document Hash:", proofData.data.document_hash?.substring(0, 16) + "...");
    }
    
  } catch (error) {
    console.error("Field proof retrieval test failed:", error);
  }
}

testFieldProofRetrieval();
