/**
 * Tamper Detection Utility
 * Provides detailed analysis of document alterations and tampering
 */

import { DocumentProof, FieldProof, VerificationResult } from '../types/proof.types';
import * as crypto from 'crypto';

export interface TamperAnalysis {
  tamperedFields: TamperedField[];
  integrityScore: number; // 0-1, where 1 is perfectly intact
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  recommendations: string[];
}

export interface TamperedField {
  field: string;
  originalValue: any;
  currentValue: any;
  originalProofHash: string;
  currentProofHash: string;
  tamperType: 'value_changed' | 'field_added' | 'field_removed' | 'metadata_altered';
  severity: 'low' | 'medium' | 'high';
  details: string;
}

export interface DocumentDiff {
  documentHashChanged: boolean;
  merkleRootChanged: boolean;
  fieldsChanged: number;
  fieldsAdded: number;
  fieldsRemoved: number;
  metadataChanged: boolean;
  changes: FieldChange[];
}

export interface FieldChange {
  field: string;
  changeType: 'value' | 'metadata' | 'removed' | 'added';
  before: unknown;
  after: unknown;
  impact: 'low' | 'medium' | 'high';
}

/**
 * Analyze a document for tampering
 */
export function analyzeTampering(
  originalProof: DocumentProof,
  verificationResult: VerificationResult
): TamperAnalysis {
  const tamperedFields: TamperedField[] = [];

  // Check if document hash changed
  if (!verificationResult.hashMatch) {
    // Document was altered - all fields are potentially tampered
    return {
      tamperedFields: originalProof.fields.map((field) => ({
        field: field.field,
        originalValue: field.value,
        currentValue: 'unknown',
        originalProofHash: field.proofHash,
        currentProofHash: 'hash_mismatch',
        tamperType: 'value_changed' as const,
        severity: 'high' as const,
        details: 'Document hash mismatch indicates the entire document was altered',
      })),
      integrityScore: 0,
      riskLevel: 'critical',
      summary: 'Document has been completely altered. Original document hash does not match.',
      recommendations: [
        'Do not trust any data from this document',
        'Request the original unaltered document',
        'Investigate who had access to alter the document',
        'Review security and access controls',
      ],
    };
  }

  // Check individual field proofs
  if (verificationResult.fieldVerifications && verificationResult.fieldVerifications.length > 0) {
    const tamperedFieldNames = verificationResult.fieldVerifications
      .filter(fv => !fv.verified)
      .map(fv => fv.field);
    
    tamperedFieldNames.forEach((fieldName) => {
      const originalField = originalProof.fields.find((f) => f.field === fieldName);
      if (originalField) {
        tamperedFields.push({
          field: fieldName,
          originalValue: originalField.value,
          currentValue: 'altered',
          originalProofHash: originalField.proofHash,
          currentProofHash: 'invalid',
          tamperType: 'value_changed',
          severity: determineFieldSeverity(fieldName, originalField.value),
          details: `Field "${fieldName}" value was changed from "${originalField.value}"`,
        });
      }
    });
  }

  // Calculate integrity score
  const totalFields = originalProof.fields.length;
  const tamperedFieldCount = tamperedFields.length;
  const integrityScore = (totalFields - tamperedFieldCount) / totalFields;

  // Determine risk level
  const riskLevel = determineRiskLevel(integrityScore, tamperedFields);

  // Generate summary
  const summary = generateTamperSummary(tamperedFieldCount, totalFields, riskLevel);

  // Generate recommendations
  const recommendations = generateRecommendations(riskLevel, tamperedFields);

  return {
    tamperedFields,
    integrityScore,
    riskLevel,
    summary,
    recommendations,
  };
}

/**
 * Compare two document proofs and generate a diff
 */
export function compareDocumentProofs(
  original: DocumentProof,
  current: DocumentProof
): DocumentDiff {
  const changes: FieldChange[] = [];

  // Check document-level changes
  const documentHashChanged = original.docHash !== current.docHash;
  const merkleRootChanged = original.merkleRoot !== current.merkleRoot;
  const metadataChanged = original.createdAt !== current.createdAt;

  // Build field maps
  const originalFields = new Map(original.fields.map((f) => [f.field, f]));
  const currentFields = new Map(current.fields.map((f) => [f.field, f]));

  // Find changed, removed, and added fields
  let fieldsChanged = 0;
  let fieldsAdded = 0;
  let fieldsRemoved = 0;

  // Check for changed and removed fields
  originalFields.forEach((originalField, fieldName) => {
    const currentField = currentFields.get(fieldName);

    if (!currentField) {
      // Field was removed
      fieldsRemoved++;
      changes.push({
        field: fieldName,
        changeType: 'removed',
        before: originalField.value,
        after: null,
        impact: determineFieldSeverity(fieldName, String(originalField.value as any)),
      });
    } else if (originalField.value !== currentField.value) {
      // Field value changed
      fieldsChanged++;
      changes.push({
        field: fieldName,
        changeType: 'value',
        before: originalField.value,
        after: currentField.value,
        impact: determineFieldSeverity(fieldName, String(originalField.value as any)),
      });
    } else if (originalField.proofHash !== currentField.proofHash) {
      // Metadata changed
      changes.push({
        field: fieldName,
        changeType: 'metadata',
        before: originalField.proofHash,
        after: currentField.proofHash,
        impact: 'low',
      });
    }
  });

  // Check for added fields
  currentFields.forEach((currentField, fieldName) => {
    if (!originalFields.has(fieldName)) {
      fieldsAdded++;
      changes.push({
        field: fieldName,
        changeType: 'added',
        before: null,
        after: currentField.value,
        impact: 'medium',
      });
    }
  });

  return {
    documentHashChanged,
    merkleRootChanged,
    fieldsChanged,
    fieldsAdded,
    fieldsRemoved,
    metadataChanged,
    changes,
  };
}

/**
 * Determine the severity of a field being tampered
 */
function determineFieldSeverity(fieldName: string, value: any): 'low' | 'medium' | 'high' {
  // High-value fields
  const highValueFields = [
    'total',
    'amount',
    'price',
    'balance',
    'payment',
    'subtotal',
    'grandtotal',
    'sum',
  ];

  // Medium-value fields
  const mediumValueFields = [
    'date',
    'timestamp',
    'vendor',
    'merchant',
    'recipient',
    'payer',
    'payee',
  ];

  const fieldLower = fieldName.toLowerCase();

  // Check if it's a high-value field
  if (highValueFields.some((f) => fieldLower.includes(f))) {
    return 'high';
  }

  // Check if it's a medium-value field
  if (mediumValueFields.some((f) => fieldLower.includes(f))) {
    return 'medium';
  }

  // Check value magnitude
  if (typeof value === 'number' && value > 1000) {
    return 'high';
  }

  return 'low';
}

/**
 * Determine overall risk level based on tampering
 */
function determineRiskLevel(
  integrityScore: number,
  tamperedFields: TamperedField[]
): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  if (integrityScore === 1) {
    return 'none';
  }

  if (integrityScore < 0.5) {
    return 'critical';
  }

  // Check for high-severity tampering
  const highSeverityCount = tamperedFields.filter((f) => f.severity === 'high').length;

  if (highSeverityCount > 0) {
    return 'high';
  }

  if (integrityScore < 0.8) {
    return 'medium';
  }

  return 'low';
}

/**
 * Generate human-readable tamper summary
 */
function generateTamperSummary(
  tamperedCount: number,
  totalCount: number,
  riskLevel: string
): string {
  if (tamperedCount === 0) {
    return 'Document integrity verified. No tampering detected.';
  }

  const percentage = Math.round((tamperedCount / totalCount) * 100);

  return `⚠️ Tampering detected: ${tamperedCount}/${totalCount} fields (${percentage}%) have been altered. Risk level: ${riskLevel.toUpperCase()}.`;
}

/**
 * Generate recommendations based on tampering analysis
 */
function generateRecommendations(
  riskLevel: string,
  tamperedFields: TamperedField[]
): string[] {
  const recommendations: string[] = [];

  switch (riskLevel) {
    case 'critical':
      recommendations.push('URGENT: Do not trust any data from this document');
      recommendations.push('Request original unaltered document immediately');
      recommendations.push('Investigate potential fraud or security breach');
      recommendations.push('Review all access logs and permissions');
      break;

    case 'high':
      recommendations.push('High-value fields have been altered');
      recommendations.push('Verify changes with document owner');
      recommendations.push('Request explanation for modifications');
      recommendations.push('Consider document invalid until verified');
      break;

    case 'medium':
      recommendations.push('Multiple fields have been modified');
      recommendations.push('Review changes with document owner');
      recommendations.push('Request justification for alterations');
      break;

    case 'low':
      recommendations.push('Minor changes detected');
      recommendations.push('Verify changes are authorized');
      recommendations.push('Update stored proof if changes are legitimate');
      break;

    case 'none':
      recommendations.push('Document is authentic and unaltered');
      recommendations.push('Safe to process and trust extracted data');
      break;
  }

  // Add specific field recommendations
  const highSeverityFields = tamperedFields
    .filter((f) => f.severity === 'high')
    .map((f) => f.field);

  if (highSeverityFields.length > 0) {
    recommendations.push(
      `Critical fields altered: ${highSeverityFields.join(', ')}. Manual review required.`
    );
  }

  return recommendations;
}

/**
 * Generate a hash of a field value for comparison
 */
export function hashFieldValue(field: string, value: any): string {
  const canonical = JSON.stringify({ field, value }, Object.keys({ field, value }).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Check if two field hashes match
 */
export function verifyFieldHash(
  field: string,
  value: any,
  expectedHash: string
): boolean {
  const actualHash = hashFieldValue(field, value);
  return actualHash === expectedHash;
}

