
const { createClient } = require("../lib/supabase.ts");

async function testDatabaseSchema() {
  try {
    const supabase = createClient();
    
    // Test documents table
    const { data: docData, error: docError } = await supabase
      .from("documents")
      .select("*")
      .limit(1);
    console.log("Documents table:", docError ? "❌ Error: " + docError.message : "✅ Accessible");
    
    // Test extractions table
    const { data: extData, error: extError } = await supabase
      .from("extractions")
      .select("*")
      .limit(1);
    console.log("Extractions table:", extError ? "❌ Error: " + extError.message : "✅ Accessible");
    
    // Test proofs table
    const { data: proofData, error: proofError } = await supabase
      .from("proofs")
      .select("*")
      .limit(1);
    console.log("Proofs table:", proofError ? "❌ Error: " + proofError.message : "✅ Accessible");
    
  } catch (error) {
    console.error("Database schema test failed:", error.message);
  }
}

testDatabaseSchema();

