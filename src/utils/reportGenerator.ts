/**
 * Verification Report Generator
 * Creates comprehensive verification reports for audit purposes
 */

import { DocumentProof, EigencomputeProof, FieldProof } from '@/types/proof.types';

export interface VerificationReport {
  reportId: string;
  generatedAt: string;
  document: {
    id: string;
    docHash: string;
    imageUrl: string;
    documentType: string;
    createdAt: string;
  };
  eigencomputeProof: {
    proofId: string;
    model: string;
    platform: string;
    attestationId: string;
    createdAt: string;
  };
  fields: Array<{
    field: string;
    value: any;
    sourceText: string;
    confidence: number;
    proofHash: string;
    verified: boolean;
  }>;
  verification: {
    verified: boolean;
    verificationTimestamp: string;
    totalFields: number;
    verifiedFields: number;
    failedFields: number;
    averageConfidence: number;
  };
  merkleRoot: string;
  summary: string;
}

export interface ReportFormat {
  format: 'json' | 'csv' | 'markdown' | 'html';
}

/**
 * Generate a comprehensive verification report
 */
export function generateVerificationReport(
  documentProof: DocumentProof,
  eigencomputeProof: EigencomputeProof,
  verificationResult?: {
    verified: boolean;
    verificationTimestamp: string;
  }
): VerificationReport {
  const totalFields = documentProof.fields.length;
  const verifiedFields = documentProof.fields.filter((f) => f.confidence >= 0.8).length;
  const failedFields = totalFields - verifiedFields;
  const averageConfidence =
    documentProof.fields.reduce((sum, f) => sum + f.confidence, 0) / totalFields;

  const report: VerificationReport = {
    reportId: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    generatedAt: new Date().toISOString(),
    document: {
      id: documentProof.docId,
      docHash: documentProof.docHash,
      imageUrl: documentProof.imageUrl || '',
      documentType: documentProof.documentType || 'unknown',
      createdAt: documentProof.createdAt,
    },
    eigencomputeProof: {
      proofId: eigencomputeProof.proofId,
      model: eigencomputeProof.apiRequest?.model || 'claude-sonnet-4.5',
      platform: eigencomputeProof.attestation.platform,
      attestationId: eigencomputeProof.attestation.attestationId,
      createdAt: eigencomputeProof.createdAt,
    },
    fields: documentProof.fields.map((field) => ({
      field: field.field,
      value: field.value,
      sourceText: field.sourceText || '',
      confidence: field.confidence,
      proofHash: field.proofHash,
      verified: field.confidence >= 0.8,
    })),
    verification: {
      verified: verificationResult?.verified ?? true,
      verificationTimestamp: verificationResult?.verificationTimestamp || new Date().toISOString(),
      totalFields,
      verifiedFields,
      failedFields,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
    },
    merkleRoot: documentProof.merkleRoot || '',
    summary: generateSummaryText({
      verified: verificationResult?.verified ?? true,
      totalFields,
      verifiedFields,
      averageConfidence,
      documentType: documentProof.documentType || 'document',
    }),
  };

  return report;
}

/**
 * Generate human-readable summary text
 */
function generateSummaryText(data: {
  verified: boolean;
  totalFields: number;
  verifiedFields: number;
  averageConfidence: number;
  documentType: string;
}): string {
  const { verified, totalFields, verifiedFields, averageConfidence, documentType } = data;

  if (!verified) {
    return `Document verification FAILED. The document has been altered since original upload.`;
  }

  const confidencePercent = Math.round(averageConfidence * 100);
  const verificationRate = Math.round((verifiedFields / totalFields) * 100);

  return `Document verified successfully. Extracted ${totalFields} fields from ${documentType} with ${confidencePercent}% average confidence. ${verifiedFields}/${totalFields} fields (${verificationRate}%) passed verification threshold.`;
}

/**
 * Export report to JSON format
 */
export function exportReportToJSON(report: VerificationReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Export report to CSV format
 */
export function exportReportToCSV(report: VerificationReport): string {
  const headers = ['Field', 'Value', 'Source Text', 'Confidence', 'Proof Hash', 'Verified'];
  const rows = report.fields.map((field) => [
    field.field,
    typeof field.value === 'object' ? JSON.stringify(field.value) : field.value,
    field.sourceText,
    field.confidence.toFixed(2),
    field.proofHash,
    field.verified ? 'Yes' : 'No',
  ]);

  const csvContent = [
    '# Verification Report',
    `# Report ID: ${report.reportId}`,
    `# Generated: ${report.generatedAt}`,
    `# Document Hash: ${report.document.docHash}`,
    `# Merkle Root: ${report.merkleRoot}`,
    `# ${report.summary}`,
    '',
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export report to Markdown format
 */
export function exportReportToMarkdown(report: VerificationReport): string {
  const markdown = `# Verification Report

**Report ID:** \`${report.reportId}\`  
**Generated:** ${new Date(report.generatedAt).toLocaleString()}

---

## Document Information

- **Document ID:** \`${report.document.id}\`
- **Document Hash:** \`${report.document.docHash}\`
- **Document Type:** ${report.document.documentType}
- **Created:** ${new Date(report.document.createdAt).toLocaleString()}

---

## Eigencompute Proof

- **Proof ID:** \`${report.eigencomputeProof.proofId}\`
- **Model:** ${report.eigencomputeProof.model}
- **Platform:** ${report.eigencomputeProof.platform}
- **Attestation ID:** \`${report.eigencomputeProof.attestationId}\`
- **Created:** ${new Date(report.eigencomputeProof.createdAt).toLocaleString()}

---

## Verification Summary

${report.summary}

- **Status:** ${report.verification.verified ? '✅ Verified' : '❌ Failed'}
- **Verified Fields:** ${report.verification.verifiedFields}/${report.verification.totalFields}
- **Average Confidence:** ${(report.verification.averageConfidence * 100).toFixed(1)}%
- **Merkle Root:** \`${report.merkleRoot}\`

---

## Extracted Fields

| Field | Value | Confidence | Verified | Proof Hash |
|-------|-------|------------|----------|------------|
${report.fields
  .map(
    (field) =>
      `| ${field.field} | ${field.value} | ${(field.confidence * 100).toFixed(1)}% | ${
        field.verified ? '✅' : '❌'
      } | \`${field.proofHash.substring(0, 16)}...\` |`
  )
  .join('\n')}

---

## Field Details

${report.fields
  .map(
    (field, index) => `### ${index + 1}. ${field.field}

- **Value:** ${field.value}
- **Source Text:** "${field.sourceText}"
- **Confidence:** ${(field.confidence * 100).toFixed(1)}%
- **Proof Hash:** \`${field.proofHash}\`
- **Status:** ${field.verified ? '✅ Verified' : '⚠️ Needs Review'}
`
  )
  .join('\n')}

---

*This report was generated automatically by TrustDocs Verification System.*
`;

  return markdown;
}

/**
 * Export report to HTML format
 */
export function exportReportToHTML(report: VerificationReport): string {
  const statusColor = report.verification.verified ? '#10b981' : '#ef4444';
  const statusIcon = report.verification.verified ? '✅' : '❌';
  const statusText = report.verification.verified ? 'Verified' : 'Failed';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Report - ${report.reportId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 2rem;
    }
    .container { 
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }
    h1 { color: #111827; font-size: 2rem; margin-bottom: 1rem; }
    h2 { color: #374151; font-size: 1.5rem; margin: 2rem 0 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
    h3 { color: #4b5563; font-size: 1.25rem; margin: 1.5rem 0 0.5rem; }
    .meta { 
      background: #f3f4f6;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 2rem;
    }
    .meta-item { margin: 0.5rem 0; }
    .meta-label { font-weight: 600; color: #6b7280; }
    .status { 
      display: inline-block;
      padding: 0.5rem 1rem;
      background: ${statusColor};
      color: white;
      border-radius: 4px;
      font-weight: 600;
      margin: 1rem 0;
    }
    .summary { 
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 1rem;
      margin: 1rem 0;
    }
    table { 
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    th, td { 
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th { 
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    tr:hover { background: #f9fafb; }
    .confidence { 
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .confidence-high { background: #d1fae5; color: #065f46; }
    .confidence-medium { background: #fef3c7; color: #92400e; }
    .confidence-low { background: #fee2e2; color: #991b1b; }
    .code { 
      background: #f3f4f6;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
    }
    .field-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 1rem;
      margin: 1rem 0;
    }
    .field-card h4 { color: #111827; margin-bottom: 0.5rem; }
    .field-detail { margin: 0.5rem 0; color: #6b7280; }
    .footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${statusIcon} Verification Report</h1>
    
    <div class="meta">
      <div class="meta-item"><span class="meta-label">Report ID:</span> <span class="code">${
        report.reportId
      }</span></div>
      <div class="meta-item"><span class="meta-label">Generated:</span> ${new Date(
        report.generatedAt
      ).toLocaleString()}</div>
      <div class="meta-item"><span class="meta-label">Document Hash:</span> <span class="code">${
        report.document.docHash
      }</span></div>
      <div class="meta-item"><span class="meta-label">Merkle Root:</span> <span class="code">${
        report.merkleRoot
      }</span></div>
    </div>

    <h2>Document Information</h2>
    <div class="meta">
      <div class="meta-item"><span class="meta-label">Document ID:</span> <span class="code">${
        report.document.id
      }</span></div>
      <div class="meta-item"><span class="meta-label">Type:</span> ${report.document.documentType}</div>
      <div class="meta-item"><span class="meta-label">Created:</span> ${new Date(
        report.document.createdAt
      ).toLocaleString()}</div>
    </div>

    <h2>Eigencompute Proof</h2>
    <div class="meta">
      <div class="meta-item"><span class="meta-label">Proof ID:</span> <span class="code">${
        report.eigencomputeProof.proofId
      }</span></div>
      <div class="meta-item"><span class="meta-label">Model:</span> ${report.eigencomputeProof.model}</div>
      <div class="meta-item"><span class="meta-label">Platform:</span> ${
        report.eigencomputeProof.platform
      }</div>
      <div class="meta-item"><span class="meta-label">Attestation ID:</span> <span class="code">${
        report.eigencomputeProof.attestationId
      }</span></div>
    </div>

    <h2>Verification Summary</h2>
    <div class="status">${statusText}</div>
    <div class="summary">${report.summary}</div>
    
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Total Fields</td>
        <td>${report.verification.totalFields}</td>
      </tr>
      <tr>
        <td>Verified Fields</td>
        <td>${report.verification.verifiedFields}</td>
      </tr>
      <tr>
        <td>Failed Fields</td>
        <td>${report.verification.failedFields}</td>
      </tr>
      <tr>
        <td>Average Confidence</td>
        <td>${(report.verification.averageConfidence * 100).toFixed(1)}%</td>
      </tr>
    </table>

    <h2>Extracted Fields</h2>
    <table>
      <thead>
        <tr>
          <th>Field</th>
          <th>Value</th>
          <th>Confidence</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${report.fields
          .map((field) => {
            const confidencePercent = (field.confidence * 100).toFixed(1);
            let confidenceClass = 'confidence-low';
            if (field.confidence >= 0.95) confidenceClass = 'confidence-high';
            else if (field.confidence >= 0.8) confidenceClass = 'confidence-medium';

            return `<tr>
          <td><strong>${field.field}</strong></td>
          <td>${field.value}</td>
          <td><span class="confidence ${confidenceClass}">${confidencePercent}%</span></td>
          <td>${field.verified ? '✅' : '⚠️'}</td>
        </tr>`;
          })
          .join('')}
      </tbody>
    </table>

    <h2>Field Details</h2>
    ${report.fields
      .map(
        (field, index) => `
    <div class="field-card">
      <h4>${index + 1}. ${field.field}</h4>
      <div class="field-detail"><strong>Value:</strong> ${field.value}</div>
      <div class="field-detail"><strong>Source Text:</strong> "${field.sourceText}"</div>
      <div class="field-detail"><strong>Confidence:</strong> ${(field.confidence * 100).toFixed(1)}%</div>
      <div class="field-detail"><strong>Proof Hash:</strong> <span class="code">${
        field.proofHash
      }</span></div>
      <div class="field-detail"><strong>Status:</strong> ${field.verified ? '✅ Verified' : '⚠️ Needs Review'}</div>
    </div>`
      )
      .join('')}

    <div class="footer">
      <p>This report was generated automatically by TrustDocs Verification System.</p>
      <p>Generated on ${new Date(report.generatedAt).toLocaleString()}</p>
    </div>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Export report in the specified format
 */
export function exportReport(report: VerificationReport, format: ReportFormat['format']): string {
  switch (format) {
    case 'json':
      return exportReportToJSON(report);
    case 'csv':
      return exportReportToCSV(report);
    case 'markdown':
      return exportReportToMarkdown(report);
    case 'html':
      return exportReportToHTML(report);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

