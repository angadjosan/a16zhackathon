/**
 * Export Utilities
 * Export document extraction data in various formats
 */

import { DocumentProof, FieldProof } from '@/types/proof.types';
import { DocumentExtraction } from '@/types/extraction.types';

export type ExportFormat = 'csv' | 'json' | 'tsv' | 'xlsx' | 'quickbooks';

export interface ExportOptions {
  format: ExportFormat;
  includeProofs?: boolean;
  includeConfidence?: boolean;
  includeBoundingBoxes?: boolean;
  includeMetadata?: boolean;
  flattenStructure?: boolean;
}

export interface ExportResult {
  filename: string;
  content: string;
  mimeType: string;
  size: number;
}

/**
 * Export document extraction to specified format
 */
export function exportDocumentData(
  documentProof: DocumentProof,
  extraction: DocumentExtraction | null,
  options: ExportOptions
): ExportResult {
  switch (options.format) {
    case 'csv':
      return exportToCSV(documentProof, extraction, options);
    case 'json':
      return exportToJSON(documentProof, extraction, options);
    case 'tsv':
      return exportToTSV(documentProof, extraction, options);
    case 'quickbooks':
      return exportToQuickBooks(documentProof, extraction, options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Export to CSV format
 */
function exportToCSV(
  documentProof: DocumentProof,
  extraction: DocumentExtraction | null,
  options: ExportOptions
): ExportResult {
  const rows: string[][] = [];

  // Build headers
  const headers = ['Field', 'Value'];

  if (options.includeConfidence) {
    headers.push('Confidence');
  }

  if (options.includeProofs) {
    headers.push('Proof Hash');
  }

  if (options.includeMetadata) {
    headers.push('Source Text', 'Model', 'Timestamp');
  }

  rows.push(headers);

  // Add metadata row
  if (options.includeMetadata) {
    rows.push(['Document ID', documentProof.docId]);
    rows.push(['Document Hash', documentProof.docHash]);
    rows.push(['Document Type', documentProof.documentType || 'unknown']);
    rows.push(['Created At', documentProof.createdAt]);
    rows.push(['Merkle Root', documentProof.merkleRoot || 'N/A']);
    rows.push([]); // Empty row for separation
  }

  // Add field rows
  documentProof.fields.forEach((field) => {
    const row: string[] = [
      field.field,
      formatValueForCSV(field.value),
    ];

    if (options.includeConfidence) {
      row.push((field.confidence * 100).toFixed(1) + '%');
    }

    if (options.includeProofs) {
      row.push(field.proofHash);
    }

    if (options.includeMetadata) {
      row.push(
        field.sourceText || '',
        field.model,
        field.timestamp
      );
    }

    rows.push(row);
  });

  // Convert to CSV string
  const csvContent = rows
    .map((row) => row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const filename = `document_${documentProof.docId}_${Date.now()}.csv`;

  return {
    filename,
    content: csvContent,
    mimeType: 'text/csv',
    size: Buffer.byteLength(csvContent, 'utf8'),
  };
}

/**
 * Export to JSON format
 */
function exportToJSON(
  documentProof: DocumentProof,
  extraction: DocumentExtraction | null,
  options: ExportOptions
): ExportResult {
  const data: any = {
    document: {
      id: documentProof.docId,
      hash: documentProof.docHash,
      type: documentProof.documentType,
      createdAt: documentProof.createdAt,
    },
    fields: documentProof.fields.map((field) => {
      const fieldData: any = {
        field: field.field,
        value: field.value,
      };

      if (options.includeConfidence) {
        fieldData.confidence = field.confidence;
      }

      if (options.includeProofs) {
        fieldData.proofHash = field.proofHash;
      }

      if (options.includeMetadata) {
        fieldData.sourceText = field.sourceText;
        fieldData.model = field.model;
        fieldData.timestamp = field.timestamp;

        if (options.includeBoundingBoxes && field.boundingBox) {
          fieldData.boundingBox = field.boundingBox;
        }
      }

      return fieldData;
    }),
  };

  if (options.includeProofs) {
    data.merkleRoot = documentProof.merkleRoot;
  }

  if (extraction && !options.flattenStructure) {
    data.extraction = extraction;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const filename = `document_${documentProof.docId}_${Date.now()}.json`;

  return {
    filename,
    content: jsonContent,
    mimeType: 'application/json',
    size: Buffer.byteLength(jsonContent, 'utf8'),
  };
}

/**
 * Export to TSV (Tab-Separated Values) format
 */
function exportToTSV(
  documentProof: DocumentProof,
  extraction: DocumentExtraction | null,
  options: ExportOptions
): ExportResult {
  const rows: string[][] = [];

  // Build headers
  const headers = ['Field', 'Value'];

  if (options.includeConfidence) {
    headers.push('Confidence');
  }

  if (options.includeProofs) {
    headers.push('Proof Hash');
  }

  rows.push(headers);

  // Add field rows
  documentProof.fields.forEach((field) => {
    const row: string[] = [
      field.field,
      formatValueForCSV(field.value),
    ];

    if (options.includeConfidence) {
      row.push((field.confidence * 100).toFixed(1) + '%');
    }

    if (options.includeProofs) {
      row.push(field.proofHash);
    }

    rows.push(row);
  });

  // Convert to TSV string
  const tsvContent = rows.map((row) => row.join('\t')).join('\n');
  const filename = `document_${documentProof.docId}_${Date.now()}.tsv`;

  return {
    filename,
    content: tsvContent,
    mimeType: 'text/tab-separated-values',
    size: Buffer.byteLength(tsvContent, 'utf8'),
  };
}

/**
 * Export to QuickBooks IIF format
 */
function exportToQuickBooks(
  documentProof: DocumentProof,
  extraction: DocumentExtraction | null,
  options: ExportOptions
): ExportResult {
  // QuickBooks IIF format for invoices/receipts
  const lines: string[] = [];

  // IIF header
  lines.push('!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO');
  lines.push('!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tAMOUNT\tDOCNUM\tMEMO');
  lines.push('!ENDTRNS');

  // Extract relevant fields
  const dateField = documentProof.fields.find(
    (f) => f.field.toLowerCase().includes('date')
  );
  const amountField = documentProof.fields.find(
    (f) => f.field.toLowerCase().includes('total') || f.field.toLowerCase().includes('amount')
  );
  const vendorField = documentProof.fields.find(
    (f) => f.field.toLowerCase().includes('vendor') || f.field.toLowerCase().includes('merchant')
  );

  const date = dateField ? formatDateForQuickBooks(dateField.value) : '';
  const amount = amountField ? parseFloat(amountField.value.toString()) : 0;
  const vendor = vendorField ? vendorField.value.toString() : 'Unknown';
  const docNum = documentProof.docId.substring(0, 8);

  // Transaction header
  lines.push(
    `TRNS\t\tINVOICE\t${date}\tAccounts Receivable\t${vendor}\t${amount}\t${docNum}\tImported from TrustDocs`
  );

  // Split line
  lines.push(
    `SPL\t\tINVOICE\t${date}\tIncome\t-${amount}\t${docNum}\tImported from TrustDocs`
  );

  lines.push('ENDTRNS');

  const iifContent = lines.join('\n');
  const filename = `quickbooks_import_${Date.now()}.iif`;

  return {
    filename,
    content: iifContent,
    mimeType: 'application/x-iif',
    size: Buffer.byteLength(iifContent, 'utf8'),
  };
}

/**
 * Batch export multiple documents
 */
export function batchExportDocuments(
  documents: Array<{
    documentProof: DocumentProof;
    extraction: DocumentExtraction | null;
  }>,
  options: ExportOptions
): ExportResult {
  if (options.format === 'json') {
    // Export as JSON array
    const data = documents.map(({ documentProof, extraction }) => {
      return {
        document: {
          id: documentProof.docId,
          hash: documentProof.docHash,
          type: documentProof.documentType,
          createdAt: documentProof.createdAt,
        },
        fields: documentProof.fields,
        extraction: extraction || null,
      };
    });

    const jsonContent = JSON.stringify(data, null, 2);
    const filename = `batch_export_${Date.now()}.json`;

    return {
      filename,
      content: jsonContent,
      mimeType: 'application/json',
      size: Buffer.byteLength(jsonContent, 'utf8'),
    };
  } else if (options.format === 'csv') {
    // Export as combined CSV
    const allRows: string[][] = [];

    // Headers
    const headers = ['Document ID', 'Field', 'Value', 'Confidence'];
    allRows.push(headers);

    // Add rows for each document
    documents.forEach(({ documentProof }) => {
      documentProof.fields.forEach((field) => {
        allRows.push([
          documentProof.docId,
          field.field,
          formatValueForCSV(field.value),
          (field.confidence * 100).toFixed(1) + '%',
        ]);
      });
    });

    const csvContent = allRows
      .map((row) => row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const filename = `batch_export_${Date.now()}.csv`;

    return {
      filename,
      content: csvContent,
      mimeType: 'text/csv',
      size: Buffer.byteLength(csvContent, 'utf8'),
    };
  }

  throw new Error('Batch export only supports JSON and CSV formats');
}

/**
 * Format a value for CSV export
 */
function formatValueForCSV(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value.toString();
}

/**
 * Format date for QuickBooks
 */
function formatDateForQuickBooks(dateValue: any): string {
  try {
    const date = new Date(dateValue);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch {
    return '';
  }
}

/**
 * Create a downloadable file blob
 */
export function createDownloadBlob(exportResult: ExportResult): Blob {
  return new Blob([exportResult.content], { type: exportResult.mimeType });
}

/**
 * Trigger browser download
 */
export function triggerDownload(exportResult: ExportResult): void {
  const blob = createDownloadBlob(exportResult);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exportResult.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

