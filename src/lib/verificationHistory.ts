/**
 * Verification History Module
 * Track and manage document verification history in the database
 */

export interface VerificationHistoryEntry {
  id: string;
  docId: string;
  verificationTimestamp: string;
  verified: boolean;
  verificationMethod: 'hash_match' | 're_upload' | 'manual' | 'api';
  hashMatch: boolean;
  attestationValid: boolean;
  fieldProofsValid: boolean;
  tamperedFields: string[];
  integrityScore: number;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  verifiedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

export interface VerificationSummary {
  docId: string;
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  lastVerificationTime: string;
  lastVerificationResult: boolean;
  verificationHistory: VerificationHistoryEntry[];
}

/**
 * In-memory verification history store
 * In production, this would be a database table
 */
class VerificationHistoryStore {
  private history: Map<string, VerificationHistoryEntry[]> = new Map();

  /**
   * Add a verification entry to history
   */
  addEntry(entry: VerificationHistoryEntry): void {
    const docHistory = this.history.get(entry.docId) || [];
    docHistory.push(entry);
    this.history.set(entry.docId, docHistory);

    console.log(`[Verification History] Added entry for doc ${entry.docId}:`, {
      verified: entry.verified,
      method: entry.verificationMethod,
      timestamp: entry.verificationTimestamp,
    });
  }

  /**
   * Get verification history for a document
   */
  getHistory(docId: string): VerificationHistoryEntry[] {
    return this.history.get(docId) || [];
  }

  /**
   * Get verification summary for a document
   */
  getSummary(docId: string): VerificationSummary | null {
    const entries = this.history.get(docId);

    if (!entries || entries.length === 0) {
      return null;
    }

    const successfulVerifications = entries.filter((e) => e.verified).length;
    const failedVerifications = entries.length - successfulVerifications;
    const lastEntry = entries[entries.length - 1];

    return {
      docId,
      totalVerifications: entries.length,
      successfulVerifications,
      failedVerifications,
      lastVerificationTime: lastEntry.verificationTimestamp,
      lastVerificationResult: lastEntry.verified,
      verificationHistory: entries,
    };
  }

  /**
   * Get all verification summaries
   */
  getAllSummaries(): VerificationSummary[] {
    const summaries: VerificationSummary[] = [];

    this.history.forEach((entries, docId) => {
      const summary = this.getSummary(docId);
      if (summary) {
        summaries.push(summary);
      }
    });

    return summaries;
  }

  /**
   * Get recent verifications across all documents
   */
  getRecentVerifications(limit: number = 10): VerificationHistoryEntry[] {
    const allEntries: VerificationHistoryEntry[] = [];

    this.history.forEach((entries) => {
      allEntries.push(...entries);
    });

    // Sort by timestamp descending
    allEntries.sort(
      (a, b) =>
        new Date(b.verificationTimestamp).getTime() -
        new Date(a.verificationTimestamp).getTime()
    );

    return allEntries.slice(0, limit);
  }

  /**
   * Get failed verifications
   */
  getFailedVerifications(limit?: number): VerificationHistoryEntry[] {
    const allEntries: VerificationHistoryEntry[] = [];

    this.history.forEach((entries) => {
      allEntries.push(...entries.filter((e) => !e.verified));
    });

    // Sort by timestamp descending
    allEntries.sort(
      (a, b) =>
        new Date(b.verificationTimestamp).getTime() -
        new Date(a.verificationTimestamp).getTime()
    );

    return limit ? allEntries.slice(0, limit) : allEntries;
  }

  /**
   * Get verifications by risk level
   */
  getVerificationsByRisk(
    riskLevel: VerificationHistoryEntry['riskLevel']
  ): VerificationHistoryEntry[] {
    const allEntries: VerificationHistoryEntry[] = [];

    this.history.forEach((entries) => {
      allEntries.push(...entries.filter((e) => e.riskLevel === riskLevel));
    });

    return allEntries;
  }

  /**
   * Clear history for a document
   */
  clearHistory(docId: string): void {
    this.history.delete(docId);
    console.log(`[Verification History] Cleared history for doc ${docId}`);
  }

  /**
   * Clear all history
   */
  clearAll(): void {
    this.history.clear();
    console.log('[Verification History] Cleared all history');
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalDocuments: number;
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    averageVerificationsPerDoc: number;
    documentsWithFailures: number;
  } {
    let totalVerifications = 0;
    let successfulVerifications = 0;
    let documentsWithFailures = 0;

    this.history.forEach((entries) => {
      totalVerifications += entries.length;
      successfulVerifications += entries.filter((e) => e.verified).length;

      if (entries.some((e) => !e.verified)) {
        documentsWithFailures++;
      }
    });

    const totalDocuments = this.history.size;
    const failedVerifications = totalVerifications - successfulVerifications;
    const averageVerificationsPerDoc =
      totalDocuments > 0 ? totalVerifications / totalDocuments : 0;

    return {
      totalDocuments,
      totalVerifications,
      successfulVerifications,
      failedVerifications,
      averageVerificationsPerDoc: Math.round(averageVerificationsPerDoc * 10) / 10,
      documentsWithFailures,
    };
  }
}

// Singleton instance
export const verificationHistory = new VerificationHistoryStore();

/**
 * Record a verification attempt
 */
export function recordVerification(
  docId: string,
  verificationResult: {
    verified: boolean;
    hashMatch: boolean;
    attestationValid: boolean;
    fieldProofsValid: boolean;
    tamperedFields?: string[];
  },
  options?: {
    verificationMethod?: VerificationHistoryEntry['verificationMethod'];
    verifiedBy?: string;
    ipAddress?: string;
    userAgent?: string;
    notes?: string;
  }
): VerificationHistoryEntry {
  const tamperedFields = verificationResult.tamperedFields || [];
  const integrityScore = calculateIntegrityScore(verificationResult);
  const riskLevel = determineRiskLevel(integrityScore, tamperedFields);

  const entry: VerificationHistoryEntry = {
    id: `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    docId,
    verificationTimestamp: new Date().toISOString(),
    verified: verificationResult.verified,
    verificationMethod: options?.verificationMethod || 'hash_match',
    hashMatch: verificationResult.hashMatch,
    attestationValid: verificationResult.attestationValid,
    fieldProofsValid: verificationResult.fieldProofsValid,
    tamperedFields,
    integrityScore,
    riskLevel,
    verifiedBy: options?.verifiedBy,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
    notes: options?.notes,
  };

  verificationHistory.addEntry(entry);

  return entry;
}

/**
 * Calculate integrity score based on verification result
 */
function calculateIntegrityScore(verificationResult: {
  verified: boolean;
  hashMatch: boolean;
  attestationValid: boolean;
  fieldProofsValid: boolean;
  tamperedFields?: string[];
}): number {
  if (!verificationResult.verified) {
    return 0;
  }

  let score = 0;

  // Hash match is most important (50%)
  if (verificationResult.hashMatch) {
    score += 0.5;
  }

  // Attestation validity (25%)
  if (verificationResult.attestationValid) {
    score += 0.25;
  }

  // Field proofs validity (25%)
  if (verificationResult.fieldProofsValid) {
    score += 0.25;
  }

  return Math.min(1, score);
}

/**
 * Determine risk level based on integrity score and tampered fields
 */
function determineRiskLevel(
  integrityScore: number,
  tamperedFields: string[]
): VerificationHistoryEntry['riskLevel'] {
  if (integrityScore === 1 && tamperedFields.length === 0) {
    return 'none';
  }

  if (integrityScore < 0.5) {
    return 'critical';
  }

  if (tamperedFields.length > 0) {
    return 'high';
  }

  if (integrityScore < 0.8) {
    return 'medium';
  }

  return 'low';
}

/**
 * Get verification trend for a document
 */
export function getVerificationTrend(docId: string): {
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  recentSuccessRate: number;
  overallSuccessRate: number;
} {
  const history = verificationHistory.getHistory(docId);

  if (history.length < 2) {
    return {
      trend: 'insufficient_data',
      recentSuccessRate: 0,
      overallSuccessRate: 0,
    };
  }

  const overallSuccesses = history.filter((e) => e.verified).length;
  const overallSuccessRate = overallSuccesses / history.length;

  // Look at last 5 verifications (or all if less than 5)
  const recentCount = Math.min(5, history.length);
  const recentEntries = history.slice(-recentCount);
  const recentSuccesses = recentEntries.filter((e) => e.verified).length;
  const recentSuccessRate = recentSuccesses / recentCount;

  let trend: 'improving' | 'declining' | 'stable' = 'stable';

  if (recentSuccessRate > overallSuccessRate + 0.1) {
    trend = 'improving';
  } else if (recentSuccessRate < overallSuccessRate - 0.1) {
    trend = 'declining';
  }

  return {
    trend,
    recentSuccessRate,
    overallSuccessRate,
  };
}

