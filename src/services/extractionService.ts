/**
 * Document Extraction Service
 * 
 * Orchestrates the complete extraction pipeline:
 * 1. Claude Vision extraction
 * 2. Eigencompute proof generation
 * 3. Database storage
 */

import { eigencomputeClient } from '../utils/eigencompute';
import { extractWithClaude, autoExtract } from '../utils/claudeExtraction';
import type { DocumentExtraction } from '../types/extraction.types';
import type { DocumentProof, EigencomputeProof, FieldProof } from '../types/proof.types';

export interface ExtractionServiceOptions {
  documentType?: 'receipt' | 'invoice' | 'contract';
  autoDetect?: boolean;
}

export interface ExtractionServiceResult {
  documentId: string;
  documentType: DocumentExtraction['documentType'];
  documentHash: string;
  extraction: DocumentExtraction;
  eigencomputeProof: EigencomputeProof;
  fieldProofs: FieldProof[];
  merkleRoot: string;
}

/**
 * Complete document extraction with proofs
 * 
 * @param documentId - Database ID of the document
 * @param imageBuffer - Image buffer of the document
 * @param options - Extraction options
 * @returns Complete extraction result with proofs
 */
export async function extractDocument(
  documentId: string,
  imageBuffer: Buffer,
  options: ExtractionServiceOptions = {}
): Promise<ExtractionServiceResult> {
  const { documentType, autoDetect = false } = options;

  console.log(`[ExtractionService] Starting extraction for document ${documentId}`);

  try {
    // Step 1: Generate document hash
    const documentHash = eigencomputeClient.generateDocumentHash(imageBuffer);
    console.log(`[ExtractionService] Document hash: ${documentHash}`);

    // Step 2: Extract with Claude
    let claudeResult;
    if (autoDetect || !documentType) {
      console.log('[ExtractionService] Auto-detecting document type');
      claudeResult = await autoExtract(imageBuffer);
    } else {
      console.log(`[ExtractionService] Extracting as ${documentType}`);
      claudeResult = await extractWithClaude(imageBuffer, { documentType });
    }

    const extraction = claudeResult.extraction;
    console.log(`[ExtractionService] Claude extracted ${extraction.fields.length} fields`);

    // Step 3: Generate Eigencompute proof
    console.log('[ExtractionService] Generating Eigencompute proofs');
    const eigencomputeProof = await eigencomputeClient.generateProof(
      documentHash,
      extraction.documentType,
      extraction,
      imageBuffer,
      'claude-sonnet-4.5'
    );

    console.log(`[ExtractionService] Generated proof with ID: ${eigencomputeProof.proofId}`);

    // Step 4: Get field proofs (generated during proof creation)
    const fieldProofs: FieldProof[] = extraction.fields.map((extractedField: any) => {
      // Construct field proof with all required properties
      const fieldProofData: FieldProof = {
        field: extractedField.field,
        value: extractedField.value,
        sourceText: extractedField.sourceText,
        boundingBox: undefined, // Will be enriched with OCR data later
        confidence: extractedField.confidence,
        model: 'claude-sonnet-4.5',
        proofHash: '', // Will be computed
        eigencomputeProofId: eigencomputeProof.proofId,
        timestamp: new Date().toISOString(),
      };

      // Generate proof hash for this field
      const proofHash = eigencomputeClient.generateFieldProofHash(fieldProofData);

      return {
        ...fieldProofData,
        proofHash,
      };
    });

    console.log(`[ExtractionService] Generated ${fieldProofs.length} field proofs`);

    // Step 5: Return complete result
    return {
      documentId,
      documentType: extraction.documentType,
      documentHash,
      extraction,
      eigencomputeProof,
      fieldProofs,
      merkleRoot: eigencomputeProof.merkleRoot || '',
    };
  } catch (error) {
    console.error('[ExtractionService] Extraction failed:', error);
    throw new Error(
      `Document extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Verify a document against stored proofs
 * 
 * @param documentId - Database ID of the original document
 * @param imageBuffer - Re-uploaded image buffer
 * @param originalProofId - Eigencompute proof ID to verify against
 * @returns Verification result
 */
export async function verifyDocument(
  documentId: string,
  imageBuffer: Buffer,
  originalProofId: string,
  originalHash: string
): Promise<import('../types/proof.types').VerificationResult> {
  console.log(`[ExtractionService] Verifying document ${documentId} against proof ${originalProofId}`);

  try {
    // Compute hash of re-uploaded document
    const newHash = eigencomputeClient.generateDocumentHash(imageBuffer);
    console.log(`[ExtractionService] Re-uploaded document hash: ${newHash}`);

    // Verify with Eigencompute
    const hashMatch = newHash === originalHash;

    console.log(`[ExtractionService] Verification result: ${hashMatch ? 'PASS' : 'FAIL'}`);

    return {
      verified: hashMatch,
      newHash,
      originalHash,
      hashMatch,
      message: hashMatch
        ? '✓ Verified: Hash matches original'
        : '⚠️ Warning: Hash mismatch - document altered',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[ExtractionService] Verification failed:', error);
    throw new Error(
      `Document verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create DocumentProof object for database storage
 * 
 * @param extractionResult - Result from extractDocument
 * @returns DocumentProof ready for database
 */
export function createDocumentProof(extractionResult: ExtractionServiceResult): DocumentProof {
  return {
    docId: extractionResult.documentId,
    docHash: extractionResult.documentHash,
    documentType: extractionResult.documentType,
    fields: extractionResult.fieldProofs,
    eigencomputeProof: extractionResult.eigencomputeProof,
    merkleRoot: extractionResult.merkleRoot,
    overallConfidence: calculateOverallConfidence(extractionResult.fieldProofs),
    processingTime: 0, // Will be set by caller if needed
    createdAt: new Date().toISOString(),
  };
}

/**
 * Calculate overall confidence for a document
 * 
 * @param fieldProofs - Array of field proofs
 * @returns Average confidence score
 */
export function calculateOverallConfidence(fieldProofs: FieldProof[]): number {
  if (fieldProofs.length === 0) return 0;

  const total = fieldProofs.reduce((sum, proof) => sum + proof.confidence, 0);
  return total / fieldProofs.length;
}

/**
 * Get low-confidence fields that need review
 * 
 * @param fieldProofs - Array of field proofs
 * @param threshold - Confidence threshold (default 0.8)
 * @returns Array of field names needing review
 */
export function getLowConfidenceFields(fieldProofs: FieldProof[], threshold = 0.8): string[] {
  return fieldProofs.filter((proof) => proof.confidence < threshold).map((proof) => proof.field);
}

