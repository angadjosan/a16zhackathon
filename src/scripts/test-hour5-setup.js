import { createClient } from '../lib/supabase.js';

async function checkTestData() {
  const supabase = createClient();
  
  // Check documents exist
  const { data: docs, error: docsError } = await supabase
    .from('documents')
    .select('*')
    .limit(5);
  
  console.log('Documents in database:', docs?.length || 0);
  
  // Check extractions exist
  const { data: extractions, error: extractionsError } = await supabase
    .from('extractions')
    .select('*')
    .limit(5);
  
  console.log('Extractions in database:', extractions?.length || 0);
  
  if (docs?.length > 0 && extractions?.length > 0) {
    console.log('✅ Test data ready');
    console.log('Sample document ID:', docs[0].id);
  } else {
    console.log('⚠️ Need to upload documents and run extraction first');
  }
}

checkTestData().catch(console.error);
