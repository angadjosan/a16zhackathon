/**
 * Proof Retrieval API Route
 * GET /api/proof/[docId]
 * 
 * Retrieves the complete proof for a document including:
 * - Document metadata and hash
 * - Eigencompute proof and attestation
 * - All field extractions with proofs
 * - Merkle root
 */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

/**
 * GET /api/proof/[docId]
 * Retrieve complete proof information for a document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const { docId } = await params;

    console.log(`[Proof API] Retrieving proof for document ${docId}`);

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(docId)) {
      console.warn(`[Proof API] Invalid UUID format: ${docId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid document ID format',
          message: 'Document ID must be a valid UUID',
        },
        { status: 400 }
      );
    }

    // Retrieve complete document proof from database
    const completeProof = await database.getCompleteDocumentProof(docId);

    if (!completeProof) {
      console.warn(`[Proof API] Document not found: ${docId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Document not found',
          message: `No document found with ID: ${docId}`,
        },
        { status: 404 }
      );
    }

    console.log(`[Proof API] Proof retrieved successfully`, {
      docId,
      docHash: completeProof.document?.doc_hash?.substring(0, 16) + '...',
      extractionCount: completeProof.extractions.length,
    });

    // Return complete proof data
    return NextResponse.json(
      {
        success: true,
        data: {
          docId: completeProof.document?.id,
          docHash: completeProof.document?.doc_hash,
          imageUrl: completeProof.document?.image_url,
          documentType: completeProof.document?.document_type,
          merkleRoot: completeProof.document?.merkle_root,
          createdAt: completeProof.document?.created_at,
          eigencomputeProof: {
            proofId: completeProof.proofMetadata?.id,
            model: completeProof.proofMetadata?.model,
            createdAt: completeProof.proofMetadata?.created_at,
          },
          fields: completeProof.extractions.map((extraction) => ({
            id: extraction.id,
            field: extraction.field,
            value: extraction.value,
            sourceText: extraction.source_text,
            boundingBox: extraction.bounding_box,
            confidence: extraction.confidence,
            proofHash: extraction.proof_hash,
            eigencomputeProofId: extraction.eigencompute_proof_id,
            model: extraction.model,
            createdAt: extraction.created_at,
          })),
          summary: {
            totalFields: completeProof.extractions.length,
            averageConfidence:
              completeProof.extractions.reduce((sum, e) => sum + e.confidence, 0) /
              completeProof.extractions.length,
            lowConfidenceFields: completeProof.extractions
              .filter((e) => e.confidence < 0.8)
              .map((e) => e.field),
            highConfidenceFields: completeProof.extractions
              .filter((e) => e.confidence >= 0.95)
              .map((e) => e.field),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Proof API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve proof. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/proof/[docId]?field=fieldName
 * Retrieve proof for a specific field
 */
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;
  const url = new URL(request.url);
  const fieldName = url.searchParams.get('field');

  if (!fieldName) {
    return NextResponse.json(
      {
        success: true,
        message: 'Proof API - Query parameters',
        queryParams: {
          field: 'Optional field name to retrieve proof for specific field only',
        },
        example: `/api/proof/${docId}?field=total`,
      },
      { status: 200 }
    );
  }

  try {
    // Get extractions for the document
    const extractions = await database.getExtractions(docId);

    if (!extractions || extractions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No extractions found',
          message: `No extractions found for document: ${docId}`,
        },
        { status: 404 }
      );
    }

    // Find the specific field
    const fieldExtraction = extractions.find((e) => e.field === fieldName);

    if (!fieldExtraction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Field not found',
          message: `Field "${fieldName}" not found in document extractions`,
          availableFields: extractions.map((e) => e.field),
        },
        { status: 404 }
      );
    }

    // Return field-specific proof
    return NextResponse.json(
      {
        success: true,
        data: {
          docId,
          field: fieldExtraction.field,
          value: fieldExtraction.value,
          sourceText: fieldExtraction.source_text,
          boundingBox: fieldExtraction.bounding_box,
          confidence: fieldExtraction.confidence,
          proofHash: fieldExtraction.proof_hash,
          eigencomputeProofId: fieldExtraction.eigencompute_proof_id,
          model: fieldExtraction.model,
          timestamp: fieldExtraction.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Proof API] Error retrieving field proof:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve field proof. Please try again.',
      },
      { status: 500 }
    );
  }
}

