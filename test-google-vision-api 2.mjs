#!/usr/bin/env node

import dotenv from 'dotenv';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

console.log('🚀 Starting Google Vision API Tests');
console.log('====================================');

// Test basic Google Vision API functionality
async function testGoogleVisionAPI() {
  try {
    console.log('\n🧪 Testing Google Vision API Integration...');
    console.log('==========================================');
    
    // Check if credentials are available
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    
    console.log(`✅ Project ID: ${projectId || 'Not set'}`);
    console.log(`✅ Credentials Path: ${credentialsPath || 'Not set'}`);
    
    if (!credentialsPath || !projectId) {
      console.log('❌ Missing Google Cloud credentials or project ID');
      return false;
    }
    
    // Check if credentials file exists
    if (!fs.existsSync(credentialsPath)) {
      console.log('❌ Credentials file not found at:', credentialsPath);
      return false;
    }
    
    // Initialize the Vision API client
    const client = new ImageAnnotatorClient({
      projectId: projectId,
      keyFilename: credentialsPath
    });
    
    console.log('📡 Initializing Google Vision client...');
    
    // Create a test image with text (simple base64 encoded text image)
    const testImageBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKACiiigAooooAKKKKAP//Z';
    
    // Test text detection with a simple sample
    console.log('📸 Testing text detection...');
    
    const [result] = await client.textDetection({
      image: {
        content: Buffer.from(testImageBase64, 'base64')
      }
    });
    
    const detections = result.textAnnotations;
    console.log('📊 Vision API Response:');
    
    if (detections && detections.length > 0) {
      console.log(`✅ Text detected: "${detections[0].description}"`);
      console.log(`✅ Confidence: ${detections[0].confidence || 'N/A'}`);
      console.log(`✅ Number of text annotations: ${detections.length}`);
    } else {
      console.log('⚠️ No text detected (this is expected with test image)');
    }
    
    console.log('\n💰 API Request Made - Credits should be consumed');
    console.log('   (Check Google Cloud Console for detailed usage)');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing Google Vision API:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    if (error.details) {
      console.error('   Details:', error.details);
    }
    return false;
  }
}

// Test with document image processing (OCR with bounding boxes)
async function testGoogleVisionDocumentOCR() {
  try {
    console.log('\n🧪 Testing Google Vision Document OCR...');
    console.log('=====================================');
    
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    
    if (!credentialsPath || !projectId) {
      console.log('❌ Missing credentials for document OCR test');
      return false;
    }
    
    const client = new ImageAnnotatorClient({
      projectId: projectId,
      keyFilename: credentialsPath
    });
    
    console.log('📄 Testing document text detection with bounding boxes...');
    
    // Simple test with document text detection
    const testImageBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCABgAMgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKACiiigAooooAKKKKAP//Z';
    
    const [result] = await client.documentTextDetection({
      image: {
        content: Buffer.from(testImageBase64, 'base64')
      }
    });
    
    console.log('📊 Document OCR Response:');
    
    if (result.textAnnotations && result.textAnnotations.length > 0) {
      console.log(`✅ Full text detected: "${result.textAnnotations[0].description?.substring(0, 100)}..."`);
      console.log(`✅ Number of text elements: ${result.textAnnotations.length}`);
      
      // Show bounding box info for first few elements
      const firstFew = result.textAnnotations.slice(1, 4); // Skip full text, show first 3 words
      firstFew.forEach((annotation, index) => {
        if (annotation.boundingPoly && annotation.boundingPoly.vertices) {
          const vertices = annotation.boundingPoly.vertices;
          console.log(`✅ Word ${index + 1}: "${annotation.description}" at [${vertices[0].x},${vertices[0].y}]`);
        }
      });
    } else {
      console.log('⚠️ No document text detected');
    }
    
    console.log('\n💰 Document OCR Request Made - Credits consumed');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing Google Vision Document OCR:', error.message);
    return false;
  }
}

// Main test execution
async function main() {
  console.log('🔍 Checking environment variables...');
  
  const basicTest = await testGoogleVisionAPI();
  const ocrTest = await testGoogleVisionDocumentOCR();
  
  console.log('\n🏁 Google Vision Test Results');
  console.log('==============================');
  console.log('Basic Text Detection:', basicTest ? '✅ PASS' : '❌ FAIL');
  console.log('Document OCR:', ocrTest ? '✅ PASS' : '❌ FAIL');
  
  if (basicTest && ocrTest) {
    console.log('\n🎉 Google Vision API is working and consuming credits!');
  } else {
    console.log('\n⚠️ Google Vision API issues detected. Check credentials and billing.');
  }
}

// Run the tests
main().catch(console.error);