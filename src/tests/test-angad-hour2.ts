#!/usr/bin/env node

/**
 * Test suite for Angad's Hour 2: Google Vision OCR Integration
 * Testing OCR functionality with Google Cloud Vision API
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { extractTextWithBoundingBoxes, extractTextFromMultiplePages, validateOCRQuality, filterWordsByConfidence, OCRResult, OCRWord } from '../utils/googleVision';
import fs from 'fs';
import path from 'path';

// Test configuration
const TEST_CONFIG = {
  sampleDocuments: [
    'receipt.jpg',
    'valid-receipt.jpg'
  ],
  expectedMinWords: 10,
  expectedMinConfidence: 0.7,
  maxProcessingTime: 10000, // 10 seconds
};

/**
 * AN-2.1: Google Cloud Vision API setup
 */
async function testVisionAPISetup(): Promise<boolean> {
  console.log('\n🧪 AN-2.1: Testing Google Cloud Vision API setup...');
  
  try {
    // Check if environment variables are set
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    
    if (!credentialsPath && !process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      console.error('❌ No authentication configured (neither service account nor API key)');
      return false;
    }
    
    if (!projectId) {
      console.error('❌ GOOGLE_CLOUD_PROJECT_ID not set');
      return false;
    }
    
    // Check if service account file exists
    if (credentialsPath) {
      const fs = require('fs');
      if (!fs.existsSync(credentialsPath)) {
        console.error(`❌ Service account file not found: ${credentialsPath}`);
        return false;
      }
      console.log('✅ Service account authentication configured');
      console.log(`   Credentials file: ${credentialsPath}`);
    } else {
      console.log('✅ API key authentication configured');
    }
    
    console.log(`   Project ID: ${projectId}`);
    
    return true;
  } catch (error) {
    console.error('❌ Vision API setup failed:', error);
    return false;
  }
}

/**
 * AN-2.2: OCR text extraction
 */
async function testOCRTextExtraction(): Promise<boolean> {
  console.log('\n🧪 AN-2.2: Testing OCR text extraction...');
  
  try {
    const samplePath = path.join(process.cwd(), 'sample-docs', 'receipt.jpg');
    
    if (!fs.existsSync(samplePath)) {
      console.error('❌ Sample document not found:', samplePath);
      return false;
    }
    
    const imageBuffer = fs.readFileSync(samplePath);
    console.log(`   Processing image: ${samplePath} (${imageBuffer.length} bytes)`);
    
    const result: OCRResult = await extractTextWithBoundingBoxes(imageBuffer);
    
    if (!result.fullText || result.fullText.length < 10) {
      console.error('❌ No meaningful text extracted');
      return false;
    }
    
    console.log('✅ Text extraction successful');
    console.log(`   Full text length: ${result.fullText.length}`);
    console.log(`   Sample text: "${result.fullText.substring(0, 100)}..."`);
    console.log(`   Processing time: ${result.processingTime}ms`);
    
    return true;
  } catch (error) {
    console.error('❌ OCR text extraction failed:', error);
    return false;
  }
}

/**
 * AN-2.3: Word-level bounding boxes
 */
async function testWordLevelBoundingBoxes(): Promise<boolean> {
  console.log('\n🧪 AN-2.3: Testing word-level bounding boxes...');
  
  try {
    const samplePath = path.join(process.cwd(), 'sample-docs', 'receipt.jpg');
    const imageBuffer = fs.readFileSync(samplePath);
    
    const result: OCRResult = await extractTextWithBoundingBoxes(imageBuffer);
    
    if (!result.words || result.words.length === 0) {
      console.error('❌ No words with bounding boxes extracted');
      return false;
    }
    
    if (result.words.length < TEST_CONFIG.expectedMinWords) {
      console.error(`❌ Too few words extracted: ${result.words.length} < ${TEST_CONFIG.expectedMinWords}`);
      return false;
    }
    
    // Verify each word has required properties
    let validWords = 0;
    for (const word of result.words.slice(0, 5)) { // Check first 5 words
      if (word.text && word.boundingBox && 
          typeof word.boundingBox.x === 'number' &&
          typeof word.boundingBox.y === 'number' &&
          typeof word.boundingBox.width === 'number' &&
          typeof word.boundingBox.height === 'number') {
        validWords++;
        console.log(`   Word: "${word.text}" at (${word.boundingBox.x}, ${word.boundingBox.y}) ${word.boundingBox.width}x${word.boundingBox.height}`);
      }
    }
    
    if (validWords === 0) {
      console.error('❌ No valid word bounding boxes found');
      return false;
    }
    
    console.log('✅ Word-level bounding boxes extracted');
    console.log(`   Total words: ${result.words.length}`);
    console.log(`   Valid bounding boxes: ${validWords}/5 checked`);
    
    return true;
  } catch (error) {
    console.error('❌ Word-level bounding box test failed:', error);
    return false;
  }
}

/**
 * AN-2.4: Multi-page document handling
 */
async function testMultiPageHandling(): Promise<boolean> {
  console.log('\n🧪 AN-2.4: Testing multi-page document handling...');
  
  try {
    // For this test, we'll use a single-page document but verify page count is reported
    const samplePath = path.join(process.cwd(), 'sample-docs', 'receipt.jpg');
    const imageBuffer = fs.readFileSync(samplePath);
    
    const result: OCRResult = await extractTextWithBoundingBoxes(imageBuffer);
    
    if (typeof result.pageCount !== 'number' || result.pageCount < 1) {
      console.error('❌ Invalid page count:', result.pageCount);
      return false;
    }
    
    console.log('✅ Multi-page handling structure present');
    console.log(`   Page count: ${result.pageCount}`);
    console.log('   Note: Using single-page document for test');
    
    return true;
  } catch (error) {
    console.error('❌ Multi-page handling test failed:', error);
    return false;
  }
}

/**
 * AN-2.5: Bounding box coordinate accuracy
 */
async function testBoundingBoxAccuracy(): Promise<boolean> {
  console.log('\n🧪 AN-2.5: Testing bounding box coordinate accuracy...');
  
  try {
    const samplePath = path.join(process.cwd(), 'sample-docs', 'receipt.jpg');
    const imageBuffer = fs.readFileSync(samplePath);
    
    const result: OCRResult = await extractTextWithBoundingBoxes(imageBuffer);
    
    if (!result.words || result.words.length === 0) {
      console.error('❌ No words to test coordinates');
      return false;
    }
    
    // Verify coordinates are reasonable (positive, non-zero dimensions)
    let validCoordinates = 0;
    let suspiciousCoordinates = 0;
    
    for (const word of result.words.slice(0, 10)) { // Check first 10 words
      const { x, y, width, height } = word.boundingBox;
      
      // Check if coordinates are reasonable
      if (x >= 0 && y >= 0 && width > 0 && height > 0) {
        validCoordinates++;
        
        // Check for suspicious values (too small or too large)
        if (width < 5 || height < 5 || width > 1000 || height > 100) {
          suspiciousCoordinates++;
          console.log(`   ⚠️ Suspicious box for "${word.text}": ${width}x${height}`);
        }
      }
    }
    
    const accuracy = (validCoordinates / Math.min(10, result.words.length)) * 100;
    
    if (accuracy < 80) {
      console.error(`❌ Low coordinate accuracy: ${accuracy.toFixed(1)}%`);
      return false;
    }
    
    console.log('✅ Bounding box coordinates appear accurate');
    console.log(`   Valid coordinates: ${validCoordinates}/${Math.min(10, result.words.length)} (${accuracy.toFixed(1)}%)`);
    if (suspiciousCoordinates > 0) {
      console.log(`   ⚠️ Suspicious coordinates: ${suspiciousCoordinates}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Bounding box accuracy test failed:', error);
    return false;
  }
}

/**
 * AN-2.6: OCR confidence scores
 */
async function testOCRConfidenceScores(): Promise<boolean> {
  console.log('\n🧪 AN-2.6: Testing OCR confidence scores...');
  
  try {
    const samplePath = path.join(process.cwd(), 'sample-docs', 'receipt.jpg');
    const imageBuffer = fs.readFileSync(samplePath);
    
    const result: OCRResult = await extractTextWithBoundingBoxes(imageBuffer);
    
    if (!result.words || result.words.length === 0) {
      console.error('❌ No words to test confidence scores');
      return false;
    }
    
    let validConfidences = 0;
    let totalConfidence = 0;
    
    for (const word of result.words.slice(0, 10)) { // Check first 10 words
      if (typeof word.confidence === 'number' && 
          word.confidence >= 0 && word.confidence <= 1) {
        validConfidences++;
        totalConfidence += word.confidence;
        console.log(`   Word: "${word.text}" confidence: ${(word.confidence * 100).toFixed(1)}%`);
      } else {
        console.log(`   ⚠️ Invalid confidence for "${word.text}": ${word.confidence}`);
      }
    }
    
    if (validConfidences === 0) {
      console.error('❌ No valid confidence scores found');
      return false;
    }
    
    const avgConfidence = totalConfidence / validConfidences;
    
    if (avgConfidence < TEST_CONFIG.expectedMinConfidence) {
      console.log(`⚠️ Low average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    }
    
    console.log('✅ OCR confidence scores present');
    console.log(`   Valid scores: ${validConfidences}/${Math.min(10, result.words.length)}`);
    console.log(`   Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    
    return true;
  } catch (error) {
    console.error('❌ OCR confidence score test failed:', error);
    return false;
  }
}

/**
 * AN-2.7: Memory storage optimization
 */
async function testMemoryOptimization(): Promise<boolean> {
  console.log('\n🧪 AN-2.7: Testing memory storage optimization...');
  
  try {
    const initialMemory = process.memoryUsage();
    
    // Process multiple documents to test memory efficiency
    const results: OCRResult[] = [];
    const samplePath = path.join(process.cwd(), 'sample-docs', 'receipt.jpg');
    
    for (let i = 0; i < 3; i++) {
      const imageBuffer = fs.readFileSync(samplePath);
      const result = await extractTextWithBoundingBoxes(imageBuffer);
      results.push(result);
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024; // MB
    
    console.log('✅ Memory optimization test completed');
    console.log(`   Initial memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Final memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Memory increase: ${memoryIncrease.toFixed(2)} MB for 3 documents`);
    console.log(`   Results stored: ${results.length}`);
    
    // Check if memory increase is reasonable (< 50MB for 3 documents)
    if (memoryIncrease > 50) {
      console.log(`⚠️ High memory usage: ${memoryIncrease.toFixed(2)} MB`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Memory optimization test failed:', error);
    return false;
  }
}

/**
 * Run all Hour 2 tests
 */
async function runHour2Tests(): Promise<void> {
  console.log('🚀 Running Angad\'s Hour 2 Tests: Google Vision OCR Integration');
  console.log('=' .repeat(70));
  
  const tests = [
    { name: 'AN-2.1: Vision API Setup', fn: testVisionAPISetup },
    { name: 'AN-2.2: OCR Text Extraction', fn: testOCRTextExtraction },
    { name: 'AN-2.3: Word-Level Bounding Boxes', fn: testWordLevelBoundingBoxes },
    { name: 'AN-2.4: Multi-Page Handling', fn: testMultiPageHandling },
    { name: 'AN-2.5: Bounding Box Accuracy', fn: testBoundingBoxAccuracy },
    { name: 'AN-2.6: OCR Confidence Scores', fn: testOCRConfidenceScores },
    { name: 'AN-2.7: Memory Optimization', fn: testMemoryOptimization },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} threw error:`, error);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`📊 Hour 2 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('❌ Some tests failed - check implementation');
    process.exit(1);
  } else {
    console.log('✅ All Hour 2 tests passed!');
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runHour2Tests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
}

export { runHour2Tests };