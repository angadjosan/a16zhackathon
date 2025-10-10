#!/usr/bin/env node

/**
 * Test cases for Angad's Hour 5 implementation
 * 
 * Tests confidence scoring and field categorization functionality
 * Based on task requirements from planning/task_list.md
 */

import {
  calculateConfidenceScore,
  processFieldsWithConfidence,
  detectFieldType,
  validateFieldFormat,
  validateLineItemsTotal,
  generateConfidenceSummary,
  getFieldsForReview,
  testConfidenceScoring,
  DEFAULT_CONFIDENCE_CONFIG,
} from '../utils/confidenceScoring.js';

import { FieldType, type ExtractedField } from '../types/document.types.js';

export async function runHour5Tests(): Promise<void> {
  console.log('🎯 Hour 5 Tests: Confidence Scoring & Field Categorization');
  console.log('='.repeat(80));
  console.log('Testing advanced confidence calculation and field validation');
  console.log('');

  let testsPassed = 0;
  let totalTests = 0;

  /**
   * Test 1: Field Type Detection
   */
  console.log('📋 Test 1: Field Type Detection');
  totalTests++;
  
  try {
    const testCases = [
      { name: 'merchant_name', value: 'Starbucks Coffee', expected: FieldType.VENDOR },
      { name: 'date', value: '12/31/2024', expected: FieldType.DATE },
      { name: 'total_amount', value: '$25.50', expected: FieldType.AMOUNT },
      { name: 'email', value: 'user@company.com', expected: FieldType.EMAIL },
      { name: 'phone', value: '555-123-4567', expected: FieldType.PHONE },
      { name: 'tax', value: '$2.50', expected: FieldType.TAX },
      { name: 'unknown_field', value: 'random text', expected: FieldType.UNKNOWN },
    ];

    let detectionsPassed = 0;
    testCases.forEach((testCase, index) => {
      const detected = detectFieldType(testCase.name, testCase.value);
      if (detected === testCase.expected) {
        detectionsPassed++;
        console.log(`  ✅ ${index + 1}. ${testCase.name}: "${testCase.value}" → ${detected}`);
      } else {
        console.log(`  ❌ ${index + 1}. ${testCase.name}: Expected ${testCase.expected}, got ${detected}`);
      }
    });

    if (detectionsPassed === testCases.length) {
      testsPassed++;
      console.log(`✅ Test 1 PASSED: ${detectionsPassed}/${testCases.length} field types detected correctly\n`);
    } else {
      console.log(`❌ Test 1 FAILED: Only ${detectionsPassed}/${testCases.length} field types detected correctly\n`);
    }
  } catch (error) {
    console.log(`❌ Test 1 FAILED: ${error}\n`);
  }

  /**
   * Test 2: Format Validation
   */
  console.log('📋 Test 2: Format Validation');
  totalTests++;

  try {
    const validationCases = [
      { type: FieldType.DATE, value: '12/31/2024', shouldPass: true },
      { type: FieldType.DATE, value: 'invalid date', shouldPass: false },
      { type: FieldType.CURRENCY, value: '$123.45', shouldPass: true },
      { type: FieldType.CURRENCY, value: 'not money', shouldPass: false },
      { type: FieldType.EMAIL, value: 'user@domain.com', shouldPass: true },
      { type: FieldType.EMAIL, value: 'not-email', shouldPass: false },
      { type: FieldType.PHONE, value: '555-123-4567', shouldPass: true },
      { type: FieldType.PHONE, value: 'not-phone', shouldPass: false },
    ];

    let validationsPassed = 0;
    validationCases.forEach((testCase, index) => {
      const isValid = validateFieldFormat(testCase.type, testCase.value);
      if (isValid === testCase.shouldPass) {
        validationsPassed++;
        console.log(`  ✅ ${index + 1}. ${testCase.type}: "${testCase.value}" → ${isValid ? 'Valid' : 'Invalid'}`);
      } else {
        console.log(`  ❌ ${index + 1}. ${testCase.type}: Expected ${testCase.shouldPass ? 'Valid' : 'Invalid'}, got ${isValid ? 'Valid' : 'Invalid'}`);
      }
    });

    if (validationsPassed === validationCases.length) {
      testsPassed++;
      console.log(`✅ Test 2 PASSED: ${validationsPassed}/${validationCases.length} format validations correct\n`);
    } else {
      console.log(`❌ Test 2 FAILED: Only ${validationsPassed}/${validationCases.length} format validations correct\n`);
    }
  } catch (error) {
    console.log(`❌ Test 2 FAILED: ${error}\n`);
  }

  /**
   * Test 3: Confidence Score Calculation
   */
  console.log('📋 Test 3: Confidence Score Calculation');
  totalTests++;

  try {
    const testField: ExtractedField = {
      name: 'total',
      value: '$25.50',
      sourceText: '$25.50',
      confidence: 0.85,
      claudeConfidence: 0.90,
      ocrConfidence: 0.80,
      boundingBox: { x: 100, y: 200, width: 60, height: 20 },
      fieldType: FieldType.AMOUNT,
      alignmentQuality: 0.95,
    };

    const allFields = [testField];
    const metrics = calculateConfidenceScore(testField, allFields);

    const expectedChecks = [
      { check: 'Base confidence calculated', condition: metrics.baseConfidence > 0 },
      { check: 'Adjusted confidence calculated', condition: metrics.adjustedConfidence > 0 },
      { check: 'Confidence level assigned', condition: ['high', 'medium', 'low'].includes(metrics.confidenceLevel) },
      { check: 'Color code assigned', condition: metrics.colorCode.startsWith('#') },
      { check: 'Field type detected', condition: metrics.fieldType === FieldType.AMOUNT },
      { check: 'Format validation performed', condition: typeof metrics.formatValid === 'boolean' },
      { check: 'Adjustments tracked', condition: Array.isArray(metrics.adjustments) },
    ];

    let checksPasssed = 0;
    expectedChecks.forEach((check, index) => {
      if (check.condition) {
        checksPasssed++;
        console.log(`  ✅ ${index + 1}. ${check.check}`);
      } else {
        console.log(`  ❌ ${index + 1}. ${check.check}`);
      }
    });

    // Additional detailed checks
    console.log(`     • Base Confidence: ${(metrics.baseConfidence * 100).toFixed(1)}%`);
    console.log(`     • Adjusted Confidence: ${(metrics.adjustedConfidence * 100).toFixed(1)}%`);
    console.log(`     • Confidence Level: ${metrics.confidenceLevel.toUpperCase()}`);
    console.log(`     • Format Valid: ${metrics.formatValid ? '✅' : '❌'}`);
    console.log(`     • Adjustments: ${metrics.adjustments.join(', ') || 'None'}`);

    if (checksPasssed === expectedChecks.length) {
      testsPassed++;
      console.log(`✅ Test 3 PASSED: All confidence score calculations working\n`);
    } else {
      console.log(`❌ Test 3 FAILED: ${checksPasssed}/${expectedChecks.length} calculations working\n`);
    }
  } catch (error) {
    console.log(`❌ Test 3 FAILED: ${error}\n`);
  }

  /**
   * Test 4: Cross-Validation (Line Items vs Total)
   */
  console.log('📋 Test 4: Cross-Validation Testing');
  totalTests++;

  try {
    // Test case 1: Matching totals (should pass)
    const matchingFields: ExtractedField[] = [
      {
        name: 'item1',
        value: '$10.00',
        sourceText: '$10.00',
        confidence: 0.95,
        fieldType: FieldType.CURRENCY,
      },
      {
        name: 'item2',
        value: '$15.50',
        sourceText: '$15.50',
        confidence: 0.92,
        fieldType: FieldType.CURRENCY,
      },
      {
        name: 'total_amount',
        value: '$25.50',
        sourceText: '$25.50',
        confidence: 0.90,
        fieldType: FieldType.AMOUNT,
      },
    ];

    // Test case 2: Non-matching totals (should fail)
    const nonMatchingFields: ExtractedField[] = [
      {
        name: 'item1',
        value: '$10.00',
        sourceText: '$10.00',
        confidence: 0.95,
        fieldType: FieldType.CURRENCY,
      },
      {
        name: 'item2',
        value: '$15.50',
        sourceText: '$15.50',
        confidence: 0.92,
        fieldType: FieldType.CURRENCY,
      },
      {
        name: 'total_amount',
        value: '$30.00', // Doesn't match sum of items
        sourceText: '$30.00',
        confidence: 0.90,
        fieldType: FieldType.AMOUNT,
      },
    ];

    const matchingValidation = validateLineItemsTotal(matchingFields);
    const nonMatchingValidation = validateLineItemsTotal(nonMatchingFields);

    if (matchingValidation && !nonMatchingValidation) {
      testsPassed++;
      console.log(`  ✅ Matching totals: ${matchingValidation ? 'PASSED' : 'FAILED'}`);
      console.log(`  ✅ Non-matching totals: ${!nonMatchingValidation ? 'CORRECTLY FAILED' : 'INCORRECTLY PASSED'}`);
      console.log(`✅ Test 4 PASSED: Cross-validation working correctly\n`);
    } else {
      console.log(`  ❌ Matching totals: ${matchingValidation ? 'PASSED' : 'FAILED'}`);
      console.log(`  ❌ Non-matching totals: ${!nonMatchingValidation ? 'CORRECTLY FAILED' : 'INCORRECTLY PASSED'}`);
      console.log(`❌ Test 4 FAILED: Cross-validation not working correctly\n`);
    }
  } catch (error) {
    console.log(`❌ Test 4 FAILED: ${error}\n`);
  }

  /**
   * Test 5: Field Processing with Confidence Scores
   */
  console.log('📋 Test 5: Complete Field Processing');
  totalTests++;

  try {
    const sampleFields: ExtractedField[] = [
      {
        name: 'vendor',
        value: 'Starbucks Coffee',
        sourceText: 'Starbucks Coffee',
        confidence: 0.92,
        claudeConfidence: 0.95,
        ocrConfidence: 0.90,
        boundingBox: { x: 100, y: 50, width: 200, height: 25 },
        alignmentQuality: 0.98,
      },
      {
        name: 'date',
        value: '12/31/2024',
        sourceText: 'l2/3l/2O24', // OCR errors
        confidence: 0.75,
        claudeConfidence: 0.88,
        ocrConfidence: 0.65,
        boundingBox: { x: 300, y: 75, width: 80, height: 20 },
        alignmentQuality: 0.70, // Low alignment quality
      },
      {
        name: 'total',
        value: '$15.67',
        sourceText: '$15.67',
        confidence: 0.87,
        claudeConfidence: 0.90,
        ocrConfidence: 0.85,
        boundingBox: { x: 250, y: 200, width: 60, height: 18 },
        alignmentQuality: 0.92,
      },
    ];

    const processedFields = processFieldsWithConfidence(sampleFields);

    const processingChecks = [
      { check: 'All fields processed', condition: processedFields.length === sampleFields.length },
      { check: 'Field types assigned', condition: processedFields.every(f => f.fieldType) },
      { check: 'Confidence metrics calculated', condition: processedFields.every(f => f.confidenceMetrics) },
      { check: 'Final confidence scores assigned', condition: processedFields.every(f => typeof f.finalConfidence === 'number') },
    ];

    let processChecksPasssed = 0;
    processingChecks.forEach((check, index) => {
      if (check.condition) {
        processChecksPasssed++;
        console.log(`  ✅ ${index + 1}. ${check.check}`);
      } else {
        console.log(`  ❌ ${index + 1}. ${check.check}`);
      }
    });

    // Display processed results
    console.log('\n  📊 Processed Field Results:');
    processedFields.forEach((field, i) => {
      const metrics = field.confidenceMetrics!;
      console.log(`    ${i + 1}. ${field.name}: ${(metrics.adjustedConfidence * 100).toFixed(1)}% (${metrics.confidenceLevel.toUpperCase()})`);
      console.log(`       Type: ${metrics.fieldType}, Format Valid: ${metrics.formatValid ? '✅' : '❌'}`);
      console.log(`       Adjustments: ${metrics.adjustments.join(', ') || 'None'}`);
    });

    if (processChecksPasssed === processingChecks.length) {
      testsPassed++;
      console.log(`\n✅ Test 5 PASSED: Complete field processing working\n`);
    } else {
      console.log(`\n❌ Test 5 FAILED: ${processChecksPasssed}/${processingChecks.length} processing checks passed\n`);
    }
  } catch (error) {
    console.log(`❌ Test 5 FAILED: ${error}\n`);
  }

  /**
   * Test 6: Confidence Summary and Review System
   */
  console.log('📋 Test 6: Confidence Summary & Review System');
  totalTests++;

  try {
    const fieldsForSummary: ExtractedField[] = [
      // High confidence field
      {
        name: 'vendor',
        value: 'Perfect Merchant',
        sourceText: 'Perfect Merchant',
        confidence: 0.98,
        finalConfidence: 0.98,
      },
      // Medium confidence field
      {
        name: 'date',
        value: '12/31/2024',
        sourceText: '12/31/2024',
        confidence: 0.85,
        finalConfidence: 0.87,
      },
      // Low confidence field (needs review)
      {
        name: 'amount',
        value: '$???.??',
        sourceText: 'unclear text',
        confidence: 0.45,
        finalConfidence: 0.45,
      },
    ];

    const summary = generateConfidenceSummary(fieldsForSummary);
    const needsReview = getFieldsForReview(fieldsForSummary, 0.80);

    const summaryChecks = [
      { check: 'Average confidence calculated', condition: summary.averageConfidence > 0 },
      { check: 'Confidence buckets counted', condition: summary.highConfidenceCount >= 0 && summary.mediumConfidenceCount >= 0 && summary.lowConfidenceCount >= 0 },
      { check: 'Total fields counted', condition: summary.totalFields === fieldsForSummary.length },
      { check: 'Review fields identified', condition: needsReview.length > 0 },
      { check: 'Fields sorted by confidence', condition: needsReview.length <= 1 || needsReview[0].finalConfidence! <= needsReview[needsReview.length - 1].finalConfidence! },
    ];

    let summaryChecksPasssed = 0;
    summaryChecks.forEach((check, index) => {
      if (check.condition) {
        summaryChecksPasssed++;
        console.log(`  ✅ ${index + 1}. ${check.check}`);
      } else {
        console.log(`  ❌ ${index + 1}. ${check.check}`);
      }
    });

    // Display summary results
    console.log('\n  📊 Confidence Summary:');
    console.log(`     • Average Confidence: ${(summary.averageConfidence * 100).toFixed(1)}%`);
    console.log(`     • High (>95%): ${summary.highConfidenceCount} fields`);
    console.log(`     • Medium (80-95%): ${summary.mediumConfidenceCount} fields`);
    console.log(`     • Low (<80%): ${summary.lowConfidenceCount} fields`);
    console.log(`     • Needs Review: ${needsReview.length} fields`);

    if (summaryChecksPasssed === summaryChecks.length) {
      testsPassed++;
      console.log(`\n✅ Test 6 PASSED: Confidence summary and review system working\n`);
    } else {
      console.log(`\n❌ Test 6 FAILED: ${summaryChecksPasssed}/${summaryChecks.length} summary checks passed\n`);
    }
  } catch (error) {
    console.log(`❌ Test 6 FAILED: ${error}\n`);
  }

  /**
   * Test 7: Built-in Testing Function
   */
  console.log('📋 Test 7: Built-in Test Function');
  totalTests++;

  try {
    console.log('Running built-in confidence scoring test...\n');
    testConfidenceScoring();
    testsPassed++;
    console.log('\n✅ Test 7 PASSED: Built-in test function executed successfully\n');
  } catch (error) {
    console.log(`❌ Test 7 FAILED: ${error}\n`);
  }

  // Final Results
  console.log('='.repeat(80));
  console.log('🏁 Hour 5 Test Results Summary');
  console.log(`✅ Tests Passed: ${testsPassed}/${totalTests}`);
  console.log(`📊 Success Rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`);

  if (testsPassed === totalTests) {
    console.log('\n🎉 ALL HOUR 5 TESTS PASSED! 🎉');
    console.log('✅ Advanced confidence calculation implemented');
    console.log('✅ Field categorization and validation working');
    console.log('✅ Cross-validation system functional');
    console.log('✅ Color-coded confidence levels working');
    console.log('✅ Review system identifies low-confidence fields');
    console.log('\n🚀 Ready for Hour 6 implementation!');
  } else {
    console.log(`\n⚠️  ${totalTests - testsPassed} test(s) failed. Please review and fix issues.`);
    console.log('\n📋 Next steps:');
    console.log('1. Review failed tests above');
    console.log('2. Check confidence scoring implementation');
    console.log('3. Verify field type detection logic');
    console.log('4. Test format validation patterns');
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runHour5Tests();
}