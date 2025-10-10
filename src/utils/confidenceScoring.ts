/**
 * Confidence Scoring System for Verifiable AI Document Processing
 * 
 * Combines OCR confidence, Claude confidence, and format validation
 * to calculate comprehensive field-level confidence scores.
 * 
 * Hour 5 Implementation - Angad
 */

import { ExtractedField, FieldType, ConfidenceMetrics } from '../types/document.types';

export interface ConfidenceBoosts {
  formatMatch: number;        // +10% if format regex matches
  crossValidation: number;    // +5% if cross-validation passes
}

export interface ConfidencePenalties {
  fuzzyMatch: number;         // -15% if string matching was fuzzy
  uncertainBoundingBox: number; // -20% if bounding box uncertain
}

export interface ConfidenceConfig {
  boosts: ConfidenceBoosts;
  penalties: ConfidencePenalties;
  confidenceThresholds: {
    high: number;    // >95% - Green
    medium: number;  // 80-95% - Yellow
    low: number;     // <80% - Red
  };
}

export const DEFAULT_CONFIDENCE_CONFIG: ConfidenceConfig = {
  boosts: {
    formatMatch: 0.10,
    crossValidation: 0.05,
  },
  penalties: {
    fuzzyMatch: 0.15,
    uncertainBoundingBox: 0.20,
  },
  confidenceThresholds: {
    high: 0.95,
    medium: 0.80,
    low: 0.00,
  },
};

/**
 * Field type patterns for format validation
 */
export const FIELD_PATTERNS: Record<FieldType, RegExp[]> = {
  [FieldType.DATE]: [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,           // MM/DD/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/,            // MM-DD-YYYY
    /^\d{4}-\d{2}-\d{2}$/,                // YYYY-MM-DD
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}$/i, // Month DD, YYYY
  ],
  [FieldType.CURRENCY]: [
    /^\$[\d,]+\.?\d{0,2}$/,                // $123.45, $1,234.56
    /^[\d,]+\.?\d{0,2}\s*(USD|CAD|EUR|GBP)$/i, // 123.45 USD
    /^(USD|CAD|EUR|GBP)\s*[\d,]+\.?\d{0,2}$/i, // USD 123.45
    /^C?\$\s*[\d,]+\.?\d{0,2}$/,          // C$ 123.45
  ],
  [FieldType.EMAIL]: [
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // email@domain.com
  ],
  [FieldType.PHONE]: [
    /^\d{3}-\d{3}-\d{4}$/,                // 555-123-4567
    /^\(\d{3}\)\s*\d{3}-\d{4}$/,         // (555) 123-4567
    /^\d{10}$/,                           // 5551234567
    /^\+1\s*\d{3}\s*\d{3}\s*\d{4}$/,    // +1 555 123 4567
  ],
  [FieldType.VENDOR]: [
    /^[A-Z][a-zA-Z\s&,.'-]{2,50}$/,      // Business names
  ],
  [FieldType.AMOUNT]: [
    /^\$?[\d,]+\.?\d{0,2}$/,             // Same as currency but more flexible
  ],
  [FieldType.TAX]: [
    /^\$?[\d,]+\.?\d{0,2}$/,             // Tax amounts
    /^\d+\.?\d{0,2}%$/,                  // Tax percentages
  ],
  [FieldType.LINE_ITEMS]: [], // No specific pattern - array validation
  [FieldType.UNKNOWN]: [],   // No pattern validation
};

/**
 * Auto-detect field type based on field name and value
 */
export function detectFieldType(fieldName: string, value: string): FieldType {
  const name = fieldName.toLowerCase();
  
  // Check field name patterns first
  if (name.includes('date') || name.includes('time')) return FieldType.DATE;
  if (name.includes('email') || name.includes('mail')) return FieldType.EMAIL;
  if (name.includes('phone') || name.includes('tel')) return FieldType.PHONE;
  if (name.includes('vendor') || name.includes('merchant') || name.includes('store')) return FieldType.VENDOR;
  if (name.includes('total') || name.includes('amount') || name.includes('subtotal')) return FieldType.AMOUNT;
  if (name.includes('tax') || name.includes('hst') || name.includes('gst')) return FieldType.TAX;
  if (name.includes('items') || name.includes('products') || name.includes('line')) return FieldType.LINE_ITEMS;
  
  // Check value patterns
  for (const [type, patterns] of Object.entries(FIELD_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(value))) {
      return type as FieldType;
    }
  }
  
  // Currency detection (most common)
  if (/[\$€£¥]/.test(value) || /\d+\.?\d{0,2}/.test(value)) {
    return FieldType.CURRENCY;
  }
  
  return FieldType.UNKNOWN;
}

/**
 * Validate field format based on detected type
 */
export function validateFieldFormat(fieldType: FieldType, value: string): boolean {
  const patterns = FIELD_PATTERNS[fieldType];
  if (!patterns || patterns.length === 0) return true; // No validation for unknown types
  
  return patterns.some(pattern => pattern.test(value));
}

/**
 * Normalize currency values for comparison
 */
export function normalizeCurrency(value: string | number): number {
  if (typeof value === 'number') return value;
  
  // Remove currency symbols and extract numeric value
  const cleaned = value.replace(/[\$€£¥,\s]/g, '');
  const match = cleaned.match(/(\d+\.?\d{0,2})/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Cross-validation: Check if line items sum to total
 */
export function validateLineItemsTotal(fields: ExtractedField[]): boolean {
  const totalField = fields.find(f => f.fieldType === FieldType.AMOUNT && 
    (f.name.toLowerCase().includes('total') || f.name.toLowerCase().includes('amount')));
  
  const lineItems = fields.filter(f => f.fieldType === FieldType.LINE_ITEMS || 
    (f.fieldType === FieldType.CURRENCY && f.name.toLowerCase().includes('item')));
  
  if (!totalField || lineItems.length === 0) return true; // Cannot validate
  
  const totalValue = normalizeCurrency(totalField.value);
  const itemsSum = lineItems.reduce((sum, item) => sum + normalizeCurrency(item.value), 0);
  
  // Allow 5% tolerance for rounding differences
  const tolerance = totalValue * 0.05;
  return Math.abs(totalValue - itemsSum) <= tolerance;
}

/**
 * Calculate comprehensive confidence score
 */
export function calculateConfidenceScore(
  field: ExtractedField,
  allFields: ExtractedField[],
  config: ConfidenceConfig = DEFAULT_CONFIDENCE_CONFIG
): ConfidenceMetrics {
  
  // Base confidence: Average of OCR and Claude confidence, fallback to existing confidence
  const ocrConf = field.ocrConfidence || field.confidence;
  const claudeConf = field.claudeConfidence || field.confidence;
  const baseConfidence = (ocrConf + claudeConf) / 2;
  
  let adjustedConfidence = baseConfidence;
  const adjustments: string[] = [];
  
  // Auto-detect field type if not set
  if (!field.fieldType || field.fieldType === FieldType.UNKNOWN) {
    field.fieldType = detectFieldType(field.name, String(field.value));
  }
  
  // Boost: Format validation
  const formatValid = validateFieldFormat(field.fieldType, String(field.value));
  if (formatValid) {
    adjustedConfidence += config.boosts.formatMatch;
    adjustments.push(`+${(config.boosts.formatMatch * 100).toFixed(0)}% format match`);
  }
  
  // Boost: Cross-validation (for totals)
  if (field.fieldType === FieldType.AMOUNT && validateLineItemsTotal(allFields)) {
    adjustedConfidence += config.boosts.crossValidation;
    adjustments.push(`+${(config.boosts.crossValidation * 100).toFixed(0)}% cross-validation`);
  }
  
  // Penalty: Fuzzy string matching
  if (field.alignmentQuality && field.alignmentQuality < 0.9) {
    adjustedConfidence -= config.penalties.fuzzyMatch;
    adjustments.push(`-${(config.penalties.fuzzyMatch * 100).toFixed(0)}% fuzzy match`);
  }
  
  // Penalty: Uncertain bounding box
  if (!field.boundingBox || (field.boundingBox.width < 10 && field.boundingBox.height < 10)) {
    adjustedConfidence -= config.penalties.uncertainBoundingBox;
    adjustments.push(`-${(config.penalties.uncertainBoundingBox * 100).toFixed(0)}% uncertain box`);
  }
  
  // Ensure confidence stays within bounds
  adjustedConfidence = Math.max(0, Math.min(1, adjustedConfidence));
  
  // Determine confidence level
  let confidenceLevel: 'high' | 'medium' | 'low';
  let colorCode: string;
  
  if (adjustedConfidence >= config.confidenceThresholds.high) {
    confidenceLevel = 'high';
    colorCode = '#22C55E'; // Green
  } else if (adjustedConfidence >= config.confidenceThresholds.medium) {
    confidenceLevel = 'medium';
    colorCode = '#F59E0B'; // Yellow/Orange
  } else {
    confidenceLevel = 'low';
    colorCode = '#EF4444'; // Red
  }
  
  return {
    baseConfidence,
    adjustedConfidence,
    confidenceLevel,
    colorCode,
    fieldType: field.fieldType,
    formatValid,
    adjustments,
    crossValidationPassed: field.fieldType === FieldType.AMOUNT ? validateLineItemsTotal(allFields) : undefined,
  };
}

/**
 * Process all fields and calculate confidence scores
 */
export function processFieldsWithConfidence(
  fields: ExtractedField[],
  config: ConfidenceConfig = DEFAULT_CONFIDENCE_CONFIG
): ExtractedField[] {
  
  return fields.map(field => {
    const metrics = calculateConfidenceScore(field, fields, config);
    
    return {
      ...field,
      fieldType: metrics.fieldType,
      confidenceMetrics: metrics,
      finalConfidence: metrics.adjustedConfidence,
    };
  });
}

/**
 * Get fields sorted by confidence (lowest first for review)
 */
export function getFieldsForReview(
  fields: ExtractedField[],
  threshold: number = 0.8
): ExtractedField[] {
  
  return fields
    .filter(field => field.finalConfidence && field.finalConfidence < threshold)
    .sort((a, b) => (a.finalConfidence || 0) - (b.finalConfidence || 0));
}

/**
 * Generate confidence summary statistics
 */
export function generateConfidenceSummary(fields: ExtractedField[]) {
  const confidences = fields
    .map(f => f.finalConfidence || f.claudeConfidence || f.confidence)
    .filter((c): c is number => typeof c === 'number' && c > 0);
  
  if (confidences.length === 0) {
    return {
      averageConfidence: 0,
      highConfidenceCount: 0,
      mediumConfidenceCount: 0,
      lowConfidenceCount: 0,
      totalFields: fields.length,
      needsReview: fields.length,
    };
  }
  
  const averageConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  
  const highConfidenceCount = confidences.filter(c => c >= 0.95).length;
  const mediumConfidenceCount = confidences.filter(c => c >= 0.80 && c < 0.95).length;
  const lowConfidenceCount = confidences.filter(c => c < 0.80).length;
  
  return {
    averageConfidence,
    highConfidenceCount,
    mediumConfidenceCount,
    lowConfidenceCount,
    totalFields: fields.length,
    needsReview: lowConfidenceCount,
  };
}

/**
 * Test the confidence scoring system
 */
export function testConfidenceScoring(): void {
  console.log('🧪 Testing Confidence Scoring System...\n');
  
  // Create sample fields for testing
  const sampleFields: ExtractedField[] = [
    {
      name: 'vendor',
      value: 'Starbucks Coffee',
      sourceText: 'Starbucks Coffee',
      confidence: 0.93, // Required field
      claudeConfidence: 0.95,
      ocrConfidence: 0.92,
      boundingBox: { x: 100, y: 50, width: 200, height: 25 },
      fieldType: FieldType.VENDOR,
      alignmentQuality: 0.98,
    },
    {
      name: 'date',
      value: '12/31/2024',
      sourceText: 'l2/3l/2O24',
      confidence: 0.82, // Required field
      claudeConfidence: 0.88,
      ocrConfidence: 0.75,
      boundingBox: { x: 300, y: 75, width: 80, height: 20 },
      fieldType: FieldType.DATE,
      alignmentQuality: 0.65, // Fuzzy match penalty
    },
    {
      name: 'total',
      value: '$15.67',
      sourceText: '$l5.67',
      confidence: 0.88, // Required field
      claudeConfidence: 0.90,
      ocrConfidence: 0.85,
      boundingBox: { x: 250, y: 200, width: 60, height: 18 },
      fieldType: FieldType.AMOUNT,
      alignmentQuality: 0.85,
    },
  ];
  
  console.log('📋 Sample Fields:');
  sampleFields.forEach((field, i) => {
    console.log(`  ${i + 1}. ${field.name}: "${field.value}" (Claude: ${field.claudeConfidence}, OCR: ${field.ocrConfidence})`);
  });
  console.log('');
  
  // Process fields with confidence scoring
  const processedFields = processFieldsWithConfidence(sampleFields);
  
  console.log('🎯 Confidence Analysis:');
  processedFields.forEach((field, i) => {
    const metrics = field.confidenceMetrics!;
    console.log(`  ${i + 1}. ${field.name}:`);
    console.log(`     • Base Confidence: ${(metrics.baseConfidence * 100).toFixed(1)}%`);
    console.log(`     • Final Confidence: ${(metrics.adjustedConfidence * 100).toFixed(1)}% (${metrics.confidenceLevel.toUpperCase()})`);
    console.log(`     • Field Type: ${metrics.fieldType}`);
    console.log(`     • Format Valid: ${metrics.formatValid ? '✅' : '❌'}`);
    console.log(`     • Adjustments: ${metrics.adjustments.join(', ') || 'None'}`);
    console.log(`     • Color Code: ${metrics.colorCode}`);
    console.log('');
  });
  
  // Generate summary
  const summary = generateConfidenceSummary(processedFields);
  console.log('📊 Confidence Summary:');
  console.log(`  • Average Confidence: ${(summary.averageConfidence * 100).toFixed(1)}%`);
  console.log(`  • High Confidence (>95%): ${summary.highConfidenceCount} fields`);
  console.log(`  • Medium Confidence (80-95%): ${summary.mediumConfidenceCount} fields`);
  console.log(`  • Low Confidence (<80%): ${summary.lowConfidenceCount} fields`);
  console.log(`  • Fields Needing Review: ${summary.needsReview}`);
  
  console.log('\n✅ Confidence scoring system test completed!');
}