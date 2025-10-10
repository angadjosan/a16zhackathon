import { alignBoundingBoxes, validateAlignment, type AlignedField } from '../utils/alignBoundingBoxes';
import { type OCRWord } from '../types/document.types';

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
  }
];

// Mock Google Vision OCR results
const ocrWords: OCRWord[] = [
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

// Test basic alignment
console.log('📋 Testing alignment functionality...');
const alignedFields: AlignedField[] = alignBoundingBoxes(claudeFields, ocrWords, { debugMode: true });

console.log('\n📊 Alignment Results:');
alignedFields.forEach(field => {
  console.log(`  ✓ ${field.name}: ${field.value}`);
  console.log(`    - Match: ${field.matchType}`);
  console.log(`    - Confidence: ${(field.confidence * 100).toFixed(1)}%`);
  if (field.boundingBox) {
    console.log(`    - Bounding Box: (${field.boundingBox.x}, ${field.boundingBox.y}) ${field.boundingBox.width}x${field.boundingBox.height}`);
  }
  console.log(`    - OCR Words: ${field.ocrWords.length}`);
});

// Test validation
const validation = validateAlignment(alignedFields);
console.log(`\n📈 Validation Summary:`);
console.log(`  - Total fields: ${validation.totalFields}`);
console.log(`  - Exact matches: ${validation.exactMatches}`);
console.log(`  - Average confidence: ${(validation.averageConfidence * 100).toFixed(1)}%`);

console.log('\n✅ Bounding Box Alignment Test Complete!');