/**
 * Test script to verify Eigencompute integration
 * Tests the upload API with Eigencompute TEE execution
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testEigencomputeIntegration() {
  console.log('🧪 Testing Eigencompute Integration...\n');

  try {
    // Read a sample image file
    const imagePath = path.join(__dirname, 'sample-docs', 'receipt.jpg');
    
    if (!fs.existsSync(imagePath)) {
      console.error('❌ Sample image not found:', imagePath);
      return;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`📄 Using sample image: ${imagePath}`);
    console.log(`📊 Image size: ${imageBuffer.length} bytes\n`);

    // Create form data
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: 'receipt.jpg',
      contentType: 'image/jpeg'
    });

    // Test the upload API
    console.log('🚀 Testing upload API with Eigencompute...');
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    const responseTime = Date.now() - startTime;
    const result = await response.json();

    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`✅ Success: ${result.success}`);

    if (result.success && result.data) {
      console.log('\n📋 Extraction Results:');
      console.log(`   Document Type: ${result.data.documentType}`);
      console.log(`   Fields Extracted: ${result.data.extractedFields.length}`);
      console.log(`   Processing Time: ${result.data.processingTime}ms`);
      console.log(`   Document Hash: ${result.data.docHash}`);
      
      console.log('\n🔍 Extracted Fields:');
      result.data.extractedFields.forEach((field, index) => {
        console.log(`   ${index + 1}. ${field.field}: ${field.value} (confidence: ${field.confidence})`);
        console.log(`      Source: "${field.sourceText}"`);
        console.log(`      Proof Hash: ${field.proofHash.substring(0, 16)}...`);
      });

      console.log('\n🔐 TEE Verification:');
      console.log(`   All fields have proof hashes: ${result.data.extractedFields.every(f => f.proofHash)}`);
      console.log(`   Proof hashes are unique: ${new Set(result.data.extractedFields.map(f => f.proofHash)).size === result.data.extractedFields.length}`);
      
    } else {
      console.log('\n❌ Upload failed:');
      console.log(`   Error: ${result.error}`);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
testEigencomputeIntegration();
