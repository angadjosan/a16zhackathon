#!/usr/bin/env node

/**
 * Test Claude API Integration
 * This will test if Claude API is working and consuming credits properly
 */

import dotenv from 'dotenv';
dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

async function testClaudeAPI() {
  console.log('🧪 Testing Claude API Integration...');
  console.log('===================================');
  
  if (!ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not found in environment variables');
    return false;
  }
  
  console.log(`✅ API Key found: ${ANTHROPIC_API_KEY.substring(0, 20)}...`);
  
  try {
    console.log('\n📡 Making API call to Claude...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: 'Hello! This is a test message. Please respond briefly to confirm the API is working.'
        }]
      })
    });
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📊 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', data);
      return false;
    }
    
    console.log('\n✅ Claude API Response:');
    console.log('Content:', data.content?.[0]?.text || 'No content');
    console.log('Usage:', data.usage);
    console.log('Model:', data.model);
    
    if (data.usage) {
      console.log(`\n💰 Credits Used:`);
      console.log(`  Input tokens: ${data.usage.input_tokens}`);
      console.log(`  Output tokens: ${data.usage.output_tokens}`);
      console.log(`  Total tokens: ${data.usage.input_tokens + data.usage.output_tokens}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing Claude API:', error.message);
    return false;
  }
}

// Test with document extraction prompt
async function testClaudeDocumentExtraction() {
  console.log('\n🧪 Testing Claude Document Extraction...');
  console.log('=======================================');
  
  try {
    console.log('📡 Testing document extraction prompt...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `
            Please extract structured data from this sample document text:
            
            "Receipt from ABC Coffee Shop
            Date: 2024-01-15
            Item: Large Latte - $4.50
            Item: Blueberry Muffin - $2.75
            Subtotal: $7.25
            Tax: $0.58
            Total: $7.83
            Payment: Credit Card"
            
            Extract the following fields as JSON:
            - merchant_name
            - date
            - total_amount
            - items (array)
            - payment_method
          `
        }]
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Document extraction error:', data);
      return false;
    }
    
    console.log('\n✅ Document Extraction Response:');
    console.log('Extracted Data:', data.content?.[0]?.text || 'No content');
    console.log('Usage:', data.usage);
    
    if (data.usage) {
      console.log(`\n💰 Credits Used for Extraction:`);
      console.log(`  Input tokens: ${data.usage.input_tokens}`);
      console.log(`  Output tokens: ${data.usage.output_tokens}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing document extraction:', error.message);
    return false;
  }
}

// Run tests
async function runClaudeTests() {
  console.log('🚀 Starting Claude API Tests');
  console.log('============================\n');
  
  const basicTest = await testClaudeAPI();
  const extractionTest = await testClaudeDocumentExtraction();
  
  console.log('\n🏁 Claude Test Results');
  console.log('======================');
  console.log(`Basic API Test: ${basicTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Document Extraction: ${extractionTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (basicTest && extractionTest) {
    console.log('\n🎉 Claude API is working and consuming credits!');
  } else {
    console.log('\n⚠️ Claude API issues detected. Check API key and billing.');
  }
}

runClaudeTests().catch(console.error);