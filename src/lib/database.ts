/**
 * Database Functions for Eigencompute Proofs and Extractions
 * 
 * Handles storage and retrieval of:
 * - Documents with hashes
 * - Eigencompute proof IDs and metadata
 * - Field-level extractions with proofs
 */

import type { DocumentProof, EigencomputeProof, FieldProof } from '../types/proof.types';
import type { DocumentExtraction } from '../types/extraction.types';

/**
 * Database document record
 */
export interface DocumentRecord {
  id: string;
  doc_hash: string;
  image_url: string;
  document_type: 'receipt' | 'invoice' | 'contract';
  merkle_root: string;
  eigencompute_proof_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database extraction record
 */
export interface ExtractionRecord {
  id: string;
  doc_id: string;
  field: string;
  value: any;
  source_text: string;
  bounding_box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  ocr_words?: any[];
  model: string;
  confidence: number;
  proof_hash: string;
  eigencompute_proof_id: string;
  created_at: string;
}

/**
 * Database proof metadata record
 */
export interface ProofMetadataRecord {
  id: string;
  doc_id: string;
  eigencompute_proof_id: string;
  proof_data: any; // Complete EigencomputeProof object
  merkle_root: string;
  attestation_platform: 'SGX' | 'NITRO';
  model: string;
  timestamp: string;
  created_at: string;
}

// Mock database for demonstration
// In production, replace with actual Supabase client
class MockDatabase {
  private documents: Map<string, DocumentRecord> = new Map();
  private extractions: Map<string, ExtractionRecord[]> = new Map();
  private proofMetadata: Map<string, ProofMetadataRecord> = new Map();

  /**
   * Store document with hash and Eigencompute proof ID
   */
  async storeDocument(
    docId: string,
    docHash: string,
    imageUrl: string,
    documentType: 'receipt' | 'invoice' | 'contract',
    merkleRoot: string,
    eigencomputeProofId: string
  ): Promise<DocumentRecord> {
    const now = new Date().toISOString();

    const record: DocumentRecord = {
      id: docId,
      doc_hash: docHash,
      image_url: imageUrl,
      document_type: documentType,
      merkle_root: merkleRoot,
      eigencompute_proof_id: eigencomputeProofId,
      created_at: now,
      updated_at: now,
    };

    this.documents.set(docId, record);
    console.log(`[Database] Stored document ${docId} with proof ${eigencomputeProofId}`);

    return record;
  }

  /**
   * Store Eigencompute proof metadata
   */
  async storeProofMetadata(
    docId: string,
    eigencomputeProof: EigencomputeProof
  ): Promise<ProofMetadataRecord> {
    const now = new Date().toISOString();

    const record: ProofMetadataRecord = {
      id: `proof_meta_${Date.now()}`,
      doc_id: docId,
      eigencompute_proof_id: eigencomputeProof.proofId,
      proof_data: eigencomputeProof,
      merkle_root: eigencomputeProof.merkleRoot,
      attestation_platform: eigencomputeProof.attestation.platform,
      model: eigencomputeProof.model,
      timestamp: eigencomputeProof.timestamp,
      created_at: now,
    };

    this.proofMetadata.set(eigencomputeProof.proofId, record);
    console.log(`[Database] Stored proof metadata for ${eigencomputeProof.proofId}`);

    return record;
  }

  /**
   * Store field extraction with proof
   */
  async storeExtraction(
    docId: string,
    field: string,
    value: any,
    sourceText: string,
    confidence: number,
    proofHash: string,
    eigencomputeProofId: string,
    model: string,
    boundingBox?: any,
    ocrWords?: any[]
  ): Promise<ExtractionRecord> {
    const now = new Date().toISOString();

    const record: ExtractionRecord = {
      id: `extraction_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      doc_id: docId,
      field,
      value,
      source_text: sourceText,
      bounding_box: boundingBox,
      ocr_words: ocrWords,
      model,
      confidence,
      proof_hash: proofHash,
      eigencompute_proof_id: eigencomputeProofId,
      created_at: now,
    };

    const existingExtractions = this.extractions.get(docId) || [];
    existingExtractions.push(record);
    this.extractions.set(docId, existingExtractions);

    console.log(`[Database] Stored extraction for ${docId}: ${field}`);

    return record;
  }

  /**
   * Store complete document proof (document + metadata + all extractions)
   */
  async storeCompleteDocumentProof(
    docId: string,
    docHash: string,
    imageUrl: string,
    documentProof: DocumentProof
  ): Promise<{
    document: DocumentRecord;
    proofMetadata: ProofMetadataRecord;
    extractions: ExtractionRecord[];
  }> {
    console.log(`[Database] Storing complete document proof for ${docId}`);

    // Store document
    const documentRecord = await this.storeDocument(
      docId,
      docHash,
      imageUrl,
      documentProof.documentType,
      documentProof.eigencomputeProof.merkleRoot,
      documentProof.eigencomputeProof.proofId
    );

    // Store proof metadata
    const proofMetadata = await this.storeProofMetadata(docId, documentProof.eigencomputeProof);

    // Store all field extractions
    const extractionRecords = await Promise.all(
      documentProof.fieldProofs.map((fieldProof) =>
        this.storeExtraction(
          docId,
          fieldProof.field,
          fieldProof.value,
          fieldProof.sourceText,
          fieldProof.confidence,
          fieldProof.proofHash,
          fieldProof.eigencomputeProofId,
          documentProof.eigencomputeProof.model,
          fieldProof.boundingBox,
          undefined // OCR words will be added later with OCR integration
        )
      )
    );

    console.log(
      `[Database] Stored complete document proof: 1 document, 1 proof metadata, ${extractionRecords.length} extractions`
    );

    return {
      document: documentRecord,
      proofMetadata,
      extractions: extractionRecords,
    };
  }

  /**
   * Get document by ID
   */
  async getDocument(docId: string): Promise<DocumentRecord | null> {
    return this.documents.get(docId) || null;
  }

  /**
   * Get document by hash
   */
  async getDocumentByHash(docHash: string): Promise<DocumentRecord | null> {
    for (const doc of this.documents.values()) {
      if (doc.doc_hash === docHash) {
        return doc;
      }
    }
    return null;
  }

  /**
   * Get extractions for a document
   */
  async getExtractions(docId: string): Promise<ExtractionRecord[]> {
    return this.extractions.get(docId) || [];
  }

  /**
   * Get proof metadata by proof ID
   */
  async getProofMetadata(eigencomputeProofId: string): Promise<ProofMetadataRecord | null> {
    return this.proofMetadata.get(eigencomputeProofId) || null;
  }

  /**
   * Get complete document proof
   */
  async getCompleteDocumentProof(docId: string): Promise<{
    document: DocumentRecord | null;
    proofMetadata: ProofMetadataRecord | null;
    extractions: ExtractionRecord[];
  }> {
    const document = await this.getDocument(docId);
    const extractions = await this.getExtractions(docId);

    let proofMetadata: ProofMetadataRecord | null = null;
    if (document) {
      proofMetadata = await this.getProofMetadata(document.eigencompute_proof_id);
    }

    return {
      document,
      proofMetadata,
      extractions,
    };
  }

  /**
   * List all documents
   */
  async listDocuments(limit = 100, offset = 0): Promise<DocumentRecord[]> {
    return Array.from(this.documents.values()).slice(offset, offset + limit);
  }

  /**
   * Clear all data (for testing)
   */
  clearAll(): void {
    this.documents.clear();
    this.extractions.clear();
    this.proofMetadata.clear();
    console.log('[Database] Cleared all data');
  }
}

// Export singleton instance
export const database = new MockDatabase();

/**
 * Initialize database (for future Supabase integration)
 */
export async function initializeDatabase(): Promise<void> {
  console.log('[Database] Initialized (mock)');
  // In production:
  // - Connect to Supabase
  // - Run migrations
  // - Set up connection pooling
}

/**
 * Database health check
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // In production, ping Supabase
    console.log('[Database] Health check: OK');
    return true;
  } catch (error) {
    console.error('[Database] Health check failed:', error);
    return false;
  }
}

