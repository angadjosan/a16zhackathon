#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

console.log('🚀 High-Volume API Credit Consumption Test');
console.log('==========================================');

// Test Claude API with multiple large requests
async function intensiveClaudeTest() {
  try {
    console.log('\n💰 Running Intensive Claude API Test...');
    console.log('=======================================');
    
    const API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!API_KEY) {
      console.log('❌ No Claude API key found');
      return;
    }
    
    console.log('📊 Making 10 large requests to consume significant credits...');
    
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    
    // Make 10 requests with large prompts to consume more credits
    for (let i = 1; i <= 10; i++) {
      console.log(`\n🔄 Request ${i}/10...`);
      
      const largePrompt = `
        Please provide a comprehensive analysis of the following business document processing workflow. 
        Analyze each step in detail, including potential challenges, best practices, and optimization strategies.
        
        Workflow Steps:
        1. Document Upload and Validation
        2. OCR Processing and Text Extraction
        3. AI-powered Data Extraction
        4. Confidence Score Calculation
        5. Human Review and Verification
        6. Data Export and Integration
        7. Audit Trail and Compliance
        
        For each step, please provide:
        - Detailed technical implementation approach
        - Potential challenges and mitigation strategies
        - Performance optimization techniques
        - Security considerations
        - Cost optimization methods
        - Integration points with other systems
        - Quality assurance measures
        - Scalability considerations
        
        Please write at least 300 words for each step, providing specific examples and actionable recommendations.
        Include code snippets where appropriate and explain the reasoning behind each recommendation.
      `.repeat(3); // Triple the prompt size
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 4000, // Request maximum tokens
          messages: [{
            role: 'user',
            content: largePrompt
          }]
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.usage) {
        const inputTokens = data.usage.input_tokens;
        const outputTokens = data.usage.output_tokens;
        
        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;
        
        console.log(`   ✅ Input: ${inputTokens} tokens, Output: ${outputTokens} tokens`);
        console.log(`   📊 Running total: ${totalInputTokens + totalOutputTokens} tokens`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`   ❌ Request ${i} failed:`, data.error?.message || 'Unknown error');
      }
    }
    
    console.log('\n💰 Claude API Credit Consumption Summary:');
    console.log(`   📥 Total Input Tokens: ${totalInputTokens}`);
    console.log(`   📤 Total Output Tokens: ${totalOutputTokens}`);
    console.log(`   🔢 Total Tokens: ${totalInputTokens + totalOutputTokens}`);
    
    // Estimate cost (approximate Claude Haiku pricing)
    const estimatedCost = (totalInputTokens * 0.00025 + totalOutputTokens * 0.00125) / 1000;
    console.log(`   💵 Estimated Cost: $${estimatedCost.toFixed(4)}`);
    
    return { totalInputTokens, totalOutputTokens, estimatedCost };
    
  } catch (error) {
    console.error('❌ Intensive Claude test error:', error.message);
    return null;
  }
}

// Test Google Vision API with multiple images
async function intensiveGoogleVisionTest() {
  try {
    console.log('\n💰 Running Intensive Google Vision API Test...');
    console.log('==============================================');
    
    const { ImageAnnotatorClient } = await import('@google-cloud/vision');
    
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    
    if (!credentialsPath || !projectId) {
      console.log('❌ Missing Google Vision credentials');
      return null;
    }
    
    const client = new ImageAnnotatorClient({
      projectId: projectId,
      keyFilename: credentialsPath
    });
    
    console.log('📊 Processing multiple images with different API features...');
    
    const imageFiles = ['./sample-docs/receipt.jpg', './sample-docs/invoice.jpg', './sample-docs/valid-receipt.jpg'];
    const apiMethods = [
      { name: 'Text Detection', method: 'textDetection' },
      { name: 'Document Text Detection', method: 'documentTextDetection' },
      { name: 'Logo Detection', method: 'logoDetection' },
      { name: 'Object Localization', method: 'objectLocalization' }
    ];
    
    let totalRequests = 0;
    
    for (const imagePath of imageFiles) {
      if (!fs.existsSync(imagePath)) continue;
      
      console.log(`\n📄 Processing: ${imagePath}`);
      const imageBuffer = fs.readFileSync(imagePath);
      
      for (const api of apiMethods) {
        try {
          console.log(`   🔄 ${api.name}...`);
          
          const [result] = await client[api.method]({
            image: { content: imageBuffer }
          });
          
          totalRequests++;
          console.log(`   ✅ ${api.name} completed (Request #${totalRequests})`);
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.log(`   ⚠️ ${api.name} failed: ${error.message}`);
        }
      }
    }
    
    console.log('\n💰 Google Vision API Credit Consumption Summary:');
    console.log(`   📊 Total API Requests Made: ${totalRequests}`);
    console.log(`   💵 Each request consumes Vision API credits`);
    console.log(`   📈 Multiple feature types used for maximum credit consumption`);
    
    // Estimate cost (approximate Vision API pricing)
    const estimatedCost = totalRequests * 0.0015; // ~$1.50 per 1000 requests
    console.log(`   💵 Estimated Cost: $${estimatedCost.toFixed(4)}`);
    
    return { totalRequests, estimatedCost };
    
  } catch (error) {
    console.error('❌ Intensive Google Vision test error:', error.message);
    return null;
  }
}

// Additional high-volume Claude test with document analysis
async function documentAnalysisTest() {
  try {
    console.log('\n📄 Document Analysis Credit Consumption Test...');
    console.log('===============================================');
    
    const API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!API_KEY) return null;
    
    // Read actual document content to analyze
    const sampleText = fs.readFileSync('./sample-docs/test.txt', 'utf8');
    
    console.log('🔄 Analyzing document content with Claude (large response)...');
    
    const analysisPrompt = `
      Please perform a comprehensive analysis of this document content and provide detailed insights:
      
      "${sampleText}"
      
      Please provide:
      1. Document type classification and confidence level
      2. Key entities extraction (names, dates, amounts, addresses)
      3. Sentiment analysis and tone assessment
      4. Content summarization (executive summary)
      5. Risk assessment and compliance considerations
      6. Data quality evaluation and recommendations
      7. Potential improvements and optimization suggestions
      8. Integration recommendations with business systems
      9. Security and privacy considerations
      10. Detailed field-by-field breakdown with confidence scores
      
      Please be very thorough and provide at least 500 words for each section.
      Include specific examples and actionable recommendations throughout your analysis.
    `;
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: analysisPrompt
        }]
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.usage) {
      console.log('✅ Document analysis completed');
      console.log(`💰 Credits consumed: ${data.usage.input_tokens} input + ${data.usage.output_tokens} output = ${data.usage.input_tokens + data.usage.output_tokens} tokens`);
      
      const cost = (data.usage.input_tokens * 0.00025 + data.usage.output_tokens * 0.00125) / 1000;
      console.log(`💵 Estimated cost: $${cost.toFixed(4)}`);
      
      return data.usage;
    } else {
      console.log('❌ Document analysis failed');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Document analysis error:', error.message);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🎯 Purpose: Generate significant API usage to trigger billing');
  console.log('⏱️ This test will make many API calls and consume substantial credits');
  console.log('💡 Check your billing dashboards in 1-2 hours for usage updates\n');
  
  const claudeResult = await intensiveClaudeTest();
  const visionResult = await intensiveGoogleVisionTest();
  const documentResult = await documentAnalysisTest();
  
  console.log('\n🏁 High-Volume Credit Consumption Summary');
  console.log('=========================================');
  
  if (claudeResult) {
    console.log(`Claude API: ${claudeResult.totalInputTokens + claudeResult.totalOutputTokens} tokens (~$${claudeResult.estimatedCost.toFixed(4)})`);
  }
  
  if (visionResult) {
    console.log(`Google Vision: ${visionResult.totalRequests} requests (~$${visionResult.estimatedCost.toFixed(4)})`);
  }
  
  if (documentResult) {
    const docTokens = documentResult.input_tokens + documentResult.output_tokens;
    const docCost = (documentResult.input_tokens * 0.00025 + documentResult.output_tokens * 0.00125) / 1000;
    console.log(`Document Analysis: ${docTokens} tokens (~$${docCost.toFixed(4)})`);
  }
  
  const totalEstimatedCost = (claudeResult?.estimatedCost || 0) + (visionResult?.estimatedCost || 0) + ((documentResult ? (documentResult.input_tokens * 0.00025 + documentResult.output_tokens * 0.00125) / 1000 : 0));
  
  console.log(`\n💰 Total Estimated Cost: $${totalEstimatedCost.toFixed(4)}`);
  
  console.log('\n📋 Next Steps:');
  console.log('1. Check Claude dashboard: https://console.anthropic.com/');
  console.log('2. Check Google Cloud Console billing');
  console.log('3. Wait 1-2 hours for billing to update');
  console.log('4. Verify credit consumption appears in your dashboards');
  
  if (totalEstimatedCost > 0.01) {
    console.log('\n✅ Significant API usage generated - billing should update soon!');
  } else {
    console.log('\n⚠️ Low usage detected - may still be in free tier');
  }
}

main().catch(console.error);