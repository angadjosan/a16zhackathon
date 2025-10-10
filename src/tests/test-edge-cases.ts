import { alignBoundingBoxes, validateAlignment, testEdgeCases, type AlignedField } from '../utils/alignBoundingBoxes';
import { type OCRWord } from '../types/document.types';

console.log('🧪 Testing Enhanced Edge Case Handling...\n');

// Test 1: Edge case handling function
console.log('📋 Test 1: Built-in Edge Case Testing');
testEdgeCases();

// Test 2: Custom edge cases
console.log('📋 Test 2: Custom Edge Cases');

const customEdgeCases = [
  {
    name: 'phoneNumber',
    value: '555-123-4567',
    sourceText: '555-l23-456?', // OCR mistakes: l instead of 1, ? instead of 7
    confidence: 0.8
  },
  {
    name: 'email',
    value: 'user@company.com',
    sourceText: 'user@cornpany.corn', // OCR mistakes: rn instead of m
    confidence: 0.85
  },
  {
    name: 'complexCurrency',
    value: 'CAD $125.50',
    sourceText: 'C$ l25,5O', // Multiple currency formats and mistakes
    confidence: 0.75
  },
  {
    name: 'dateWithSlashes',
    value: '12/31/2024',
    sourceText: 'l2/3l/2O24', // Common date OCR issues
    confidence: 0.9
  }
];

const customOcrWords: OCRWord[] = [
  { text: '555-123-4567', confidence: 0.78, boundingBox: { x: 100, y: 50, width: 100, height: 18 } },
  { text: 'user@company.com', confidence: 0.88, boundingBox: { x: 100, y: 80, width: 130, height: 18 } },
  { text: 'CAD', confidence: 0.92, boundingBox: { x: 100, y: 110, width: 35, height: 18 } },
  { text: '$125.50', confidence: 0.85, boundingBox: { x: 140, y: 110, width: 65, height: 18 } },
  { text: '12/31/2024', confidence: 0.89, boundingBox: { x: 100, y: 140, width: 85, height: 18 } },
];

const customAligned = alignBoundingBoxes(customEdgeCases, customOcrWords, { 
  debugMode: true,
  fuzzyThreshold: 0.65,
  currencyChars: ['$', 'C$', 'CAD', 'USD', '€', '£']
});

console.log('\n📊 Custom Edge Case Results:');
customAligned.forEach(field => {
  console.log(`  ✓ ${field.name}: "${field.value}"`);
  console.log(`    - Source: "${field.sourceText}"`);
  console.log(`    - Match: ${field.matchType}`);
  console.log(`    - Confidence: ${(field.confidence * 100).toFixed(1)}%`);
  if (field.ocrWords.length > 0) {
    console.log(`    - OCR Words: [${field.ocrWords.map(w => `"${w.text}"`).join(', ')}]`);
  }
  console.log();
});

// Test 3: Multi-line and special character handling
console.log('📋 Test 3: Multi-line and Special Characters');

const multiLineFields = [
  {
    name: 'address',
    value: '123 Main Street, Suite 100, New York, NY 10001',
    sourceText: '123 Main Street\nSuite 100\nNew York, NY 10001',
    confidence: 0.9
  },
  {
    name: 'description',
    value: 'Premium "Artisan" Coffee — Limited Edition',
    sourceText: 'Premium "Artisan" Coffee – Limited Edition',
    confidence: 0.85
  }
];

const multiLineOcr: OCRWord[] = [
  { text: '123', confidence: 0.95, boundingBox: { x: 100, y: 50, width: 30, height: 18 } },
  { text: 'Main', confidence: 0.94, boundingBox: { x: 135, y: 50, width: 40, height: 18 } },
  { text: 'Street', confidence: 0.93, boundingBox: { x: 180, y: 50, width: 50, height: 18 } },
  { text: 'Suite', confidence: 0.91, boundingBox: { x: 100, y: 75, width: 45, height: 18 } },
  { text: '100', confidence: 0.95, boundingBox: { x: 150, y: 75, width: 30, height: 18 } },
  { text: 'New', confidence: 0.94, boundingBox: { x: 100, y: 100, width: 35, height: 18 } },
  { text: 'York,', confidence: 0.92, boundingBox: { x: 140, y: 100, width: 45, height: 18 } },
  { text: 'NY', confidence: 0.93, boundingBox: { x: 190, y: 100, width: 25, height: 18 } },
  { text: '10001', confidence: 0.95, boundingBox: { x: 220, y: 100, width: 45, height: 18 } },
  { text: 'Premium', confidence: 0.89, boundingBox: { x: 100, y: 130, width: 65, height: 18 } },
  { text: '"Artisan"', confidence: 0.86, boundingBox: { x: 170, y: 130, width: 70, height: 18 } },
  { text: 'Coffee', confidence: 0.88, boundingBox: { x: 245, y: 130, width: 50, height: 18 } },
  { text: '—', confidence: 0.75, boundingBox: { x: 300, y: 130, width: 15, height: 18 } },
  { text: 'Limited', confidence: 0.87, boundingBox: { x: 320, y: 130, width: 55, height: 18 } },
  { text: 'Edition', confidence: 0.89, boundingBox: { x: 380, y: 130, width: 50, height: 18 } }
];

const multiLineAligned = alignBoundingBoxes(multiLineFields, multiLineOcr, { 
  debugMode: true,
  fuzzyThreshold: 0.7 
});

console.log('\n📊 Multi-line Results:');
multiLineAligned.forEach(field => {
  console.log(`  ✓ ${field.name}: "${field.value}"`);
  console.log(`    - Source: "${field.sourceText.replace(/[\r\n]/g, '\\n')}"`);
  console.log(`    - Match: ${field.matchType}`);
  console.log(`    - Confidence: ${(field.confidence * 100).toFixed(1)}%`);
  console.log(`    - OCR Words: ${field.ocrWords.length}`);
  if (field.boundingBox) {
    console.log(`    - Bounding Box: (${field.boundingBox.x}, ${field.boundingBox.y}) ${field.boundingBox.width}x${field.boundingBox.height}`);
  }
  console.log();
});

// Final validation
const allFields = [...customAligned, ...multiLineAligned];
const finalValidation = validateAlignment(allFields);

console.log('📈 Final Validation Summary:');
console.log(`  - Total fields tested: ${finalValidation.totalFields}`);
console.log(`  - Exact matches: ${finalValidation.exactMatches}`);
console.log(`  - Fuzzy matches: ${finalValidation.fuzzyMatches}`);
console.log(`  - Partial matches: ${finalValidation.partialMatches}`);
console.log(`  - No matches: ${finalValidation.noMatches}`);
console.log(`  - Average confidence: ${(finalValidation.averageConfidence * 100).toFixed(1)}%`);

if (finalValidation.edgeCases.length > 0) {
  console.log('\n🔍 Edge Cases Detected:');
  finalValidation.edgeCases.forEach(edgeCase => console.log(`  - ${edgeCase}`));
}

if (finalValidation.warnings.length > 0) {
  console.log('\n⚠️ Validation Warnings:');
  finalValidation.warnings.forEach(warning => console.log(`  - ${warning}`));
}

console.log('\n✅ Enhanced Edge Case Testing Complete!');