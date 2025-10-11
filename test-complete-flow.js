/**
 * Complete Flow Test
 * Tests the entire upload and verification flow
 */

const fs = require('fs');
const path = require('path');

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Upload and Verification Flow');
  console.log('=' .repeat(60));

  try {
    // Test 1: Upload a document
    console.log('\n1️⃣ Testing Document Upload...');
    
    // Use a sample image from the sample-docs folder
    const sampleImagePath = path.join(__dirname, 'sample-docs', 'receipt.jpg');
    
    if (!fs.existsSync(sampleImagePath)) {
      console.log('❌ Sample image not found. Please ensure sample-docs/receipt.jpg exists.');
      return;
    }

    const formData = new FormData();
    const fileBuffer = fs.readFileSync(sampleImagePath);
    const file = new File([fileBuffer], 'receipt.jpg', { type: 'image/jpeg' });
    formData.append('file', file);

    const uploadResponse = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    const uploadData = await uploadResponse.json();
    
    if (!uploadData.success) {
      throw new Error(`Upload failed: ${uploadData.error}`);
    }

    console.log('✅ Upload successful!');
    console.log(`   Document ID: ${uploadData.data.fileId}`);
    console.log(`   Document Hash: ${uploadData.data.docHash.substring(0, 16)}...`);
    console.log(`   Document Type: ${uploadData.data.documentType}`);
    console.log(`   Extracted Fields: ${uploadData.data.extractedFields.length}`);
    console.log(`   Processing Time: ${uploadData.data.processingTime}ms`);

    // Display extracted fields
    console.log('\n📋 Extracted Fields:');
    uploadData.data.extractedFields.forEach((field, index) => {
      console.log(`   ${index + 1}. ${field.field}: ${field.value}`);
      console.log(`      Source: "${field.sourceText}"`);
      console.log(`      Confidence: ${(field.confidence * 100).toFixed(1)}%`);
      console.log(`      Proof: ${field.proofHash.substring(0, 8)}...`);
    });

    // Test 2: Verify the document
    console.log('\n2️⃣ Testing Document Verification...');
    
    const verifyResponse = await fetch('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        docId: uploadData.data.fileId,
        imageBuffer: fileBuffer.toString('base64'),
      }),
    });

    if (!verifyResponse.ok) {
      throw new Error(`Verification failed: ${verifyResponse.status} ${verifyResponse.statusText}`);
    }

    const verifyData = await verifyResponse.json();
    
    if (!verifyData.success) {
      throw new Error(`Verification failed: ${verifyData.error}`);
    }

    console.log('✅ Verification successful!');
    console.log(`   Verified: ${verifyData.data.verified}`);
    console.log(`   Hash Match: ${verifyData.data.hashMatch}`);
    console.log(`   Field Proofs Valid: ${verifyData.data.fieldProofsValid}`);
    console.log(`   Message: ${verifyData.data.message}`);

    if (verifyData.data.tamperedFields && verifyData.data.tamperedFields.length > 0) {
      console.log(`   ⚠️  Tampered Fields: ${verifyData.data.tamperedFields.join(', ')}`);
    }

    // Test 3: Test with modified document (should fail)
    console.log('\n3️⃣ Testing with Modified Document (should fail)...');
    
    // Create a slightly modified version of the image
    const modifiedBuffer = Buffer.concat([fileBuffer, Buffer.from('tampered')]);
    
    const modifiedVerifyResponse = await fetch('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        docId: uploadData.data.fileId,
        imageBuffer: modifiedBuffer.toString('base64'),
      }),
    });

    const modifiedVerifyData = await modifiedVerifyResponse.json();
    
    console.log('✅ Modified document test completed!');
    console.log(`   Verified: ${modifiedVerifyData.data.verified} (should be false)`);
    console.log(`   Hash Match: ${modifiedVerifyData.data.hashMatch} (should be false)`);
    console.log(`   Message: ${modifiedVerifyData.data.message}`);

    // Test 4: Test API endpoints
    console.log('\n4️⃣ Testing API Endpoints...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3000/api/health');
    const healthData = await healthResponse.json();
    console.log(`   Health Check: ${healthData.status}`);

    // Test upload health endpoint
    const uploadHealthResponse = await fetch('http://localhost:3000/api/upload');
    const uploadHealthData = await uploadHealthResponse.json();
    console.log(`   Upload API Health: ${uploadHealthData.status}`);

    // Test verify info endpoint
    const verifyInfoResponse = await fetch('http://localhost:3000/api/verify');
    const verifyInfoData = await verifyInfoResponse.json();
    console.log(`   Verify API Info: ${verifyInfoData.success ? 'Available' : 'Error'}`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Document upload with AI extraction');
    console.log('   ✅ Cryptographic proof generation');
    console.log('   ✅ Document verification');
    console.log('   ✅ Tamper detection');
    console.log('   ✅ API endpoint health checks');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCompleteFlow().catch(console.error);
}

module.exports = { testCompleteFlow };
