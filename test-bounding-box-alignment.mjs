#!/usr/bin/env node
import { alignBoundingBoxes, validateAlignment } from '../src/utils/alignBoundingBoxes.js';

console.log('🧪 Testing Bounding Box Alignment...\n');

// Mock Claude extraction results
const claudeFields = [
  {
    name: 'total',
    value: 24.99,
    sourceText: '$24.99',
    confidence: 0.95
  },
  {
    name: 'vendor',
    value: 'Starbucks Coffee',
    sourceText: 'Starbucks Coffee',
    confidence: 0.88
  },
  {
    name: 'date',
    value: '2024-01-15',
    sourceText: '01/15/2024',
    confidence: 0.92
  },
  {
    name: 'item',
    value: 'Grande Latte',
    sourceText: 'Grande Latte',
    confidence: 0.85
  }
];

// Mock Google Vision OCR results
const ocrWords = [
  {
    text: 'Starbucks',
    confidence: 0.98,
    boundingBox: { x: 100, y: 50, width: 120, height: 25 }
  },
  {
    text: 'Coffee',
    confidence: 0.97,
    boundingBox: { x: 225, y: 50, width: 80, height: 25 }
  },
  {
    text: 'Grande',
    confidence: 0.94,
    boundingBox: { x: 100, y: 120, width: 70, height: 20 }
  },
  {
    text: 'Latte',
    confidence: 0.93,
    boundingBox: { x: 175, y: 120, width: 60, height: 20 }
  },
  {
    text: '$24.99',
    confidence: 0.96,
    boundingBox: { x: 250, y: 180, width: 80, height: 25 }
  },
  {
    text: '01/15/2024',
    confidence: 0.91,
    boundingBox: { x: 100, y: 80, width: 120, height: 20 }
  }
];

// Test 1: Basic alignment
console.log('📋 Test 1: Basic alignment');
const alignedFields = alignBoundingBoxes(claudeFields, ocrWords, { debugMode: true });

alignedFields.forEach(field => {
  console.log(`  ✓ ${field.name}: ${field.value}`);
  console.log(`    - Source: "${field.sourceText}"`);
  console.log(`    - Match: ${field.matchType} (score: ${field.matchScore?.toFixed(3) || 'N/A'})`);
  console.log(`    - Confidence: ${(field.confidence * 100).toFixed(1)}%`);
  if (field.boundingBox) {
    console.log(`    - Box: (${field.boundingBox.x}, ${field.boundingBox.y}) ${field.boundingBox.width}x${field.boundingBox.height}`);
  }
  console.log(`    - OCR Words: ${field.ocrWords.length}`);
  console.log();
});

// Test 2: Validation
console.log('📊 Test 2: Validation Results');
const validation = validateAlignment(alignedFields);
console.log(`  Total fields: ${validation.totalFields}`);
console.log(`  Exact matches: ${validation.exactMatches}`);
console.log(`  Fuzzy matches: ${validation.fuzzyMatches}`);
console.log(`  Partial matches: ${validation.partialMatches}`);
console.log(`  No matches: ${validation.noMatches}`);
console.log(`  Average confidence: ${(validation.averageConfidence * 100).toFixed(1)}%`);

if (validation.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  validation.warnings.forEach(warning => console.log(`  - ${warning}`));
}

// Test 3: Edge cases
console.log('\n🔧 Test 3: Edge Cases');

const edgeCaseFields = [
  {
    name: 'ocrMistake',
    value: '50.00',
    sourceText: '$5O.OO', // OCR mistake: 5O instead of 50, OO instead of 00
    confidence: 0.8
  },
  {
    name: 'multiWord',
    value: 'New York Store',
    sourceText: 'New York Store', // Multiple words
    confidence: 0.9
  }
];

const edgeCaseOCR = [
  {
    text: '$50.00',
    confidence: 0.88,
    boundingBox: { x: 100, y: 200, width: 80, height: 25 }
  },
  {
    text: 'New',
    confidence: 0.95,
    boundingBox: { x: 100, y: 250, width: 40, height: 20 }
  },
  {
    text: 'York',
    confidence: 0.93,
    boundingBox: { x: 145, y: 250, width: 50, height: 20 }
  },
  {
    text: 'Store',
    confidence: 0.94,
    boundingBox: { x: 200, y: 250, width: 60, height: 20 }
  }
];

const edgeAligned = alignBoundingBoxes(edgeCaseFields, edgeCaseOCR, { 
  debugMode: true,
  fuzzyThreshold: 0.7 
});

edgeAligned.forEach(field => {
  console.log(`  ✓ ${field.name}: "${field.value}"`);
  console.log(`    - Source: "${field.sourceText}"`);
  console.log(`    - Match: ${field.matchType}`);
  console.log(`    - Confidence: ${(field.confidence * 100).toFixed(1)}%`);
  console.log();
});

console.log('✅ Bounding Box Alignment Tests Complete!\n');