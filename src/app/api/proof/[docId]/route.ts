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

interface RouteParams {
  params: {
    docId: string;
  };
}

/**
 * GET /api/proof/[docId]
 * Retrieve complete proof information for a document
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { docId } = params;

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
      docHash: completeProof.document.docHash.substring(0, 16) + '...',
      extractionCount: completeProof.extractions.length,
      proofId: completeProof.proofMetadata.proofId,
    });

    // Return complete proof data
    return NextResponse.json(
      {
        success: true,
        data: {
          docId: completeProof.document.id,
          docHash: completeProof.document.docHash,
          imageUrl: completeProof.document.imageUrl,
          documentType: completeProof.document.documentType,
          merkleRoot: completeProof.document.merkleRoot,
          createdAt: completeProof.document.createdAt,
          eigencomputeProof: {
            proofId: completeProof.proofMetadata.proofId,
            model: completeProof.proofMetadata.model,
            attestation: {
              platform: completeProof.proofMetadata.attestation.platform,
              attestationId: completeProof.proofMetadata.attestation.attestationId,
              signature: completeProof.proofMetadata.attestation.signature,
            },
            createdAt: completeProof.proofMetadata.createdAt,
          },
          fields: completeProof.extractions.map((extraction) => ({
            id: extraction.id,
            field: extraction.field,
            value: extraction.value,
            sourceText: extraction.sourceText,
            boundingBox: extraction.boundingBox,
            confidence: extraction.confidence,
            proofHash: extraction.proofHash,
            eigencomputeProofId: extraction.eigencomputeProofId,
            model: extraction.model,
            createdAt: extraction.createdAt,
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
export async function OPTIONS(request: NextRequest, { params }: RouteParams) {
  const { docId } = params;
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
          sourceText: fieldExtraction.sourceText,
          boundingBox: fieldExtraction.boundingBox,
          confidence: fieldExtraction.confidence,
          proofHash: fieldExtraction.proofHash,
          eigencomputeProofId: fieldExtraction.eigencomputeProofId,
          model: fieldExtraction.model,
          timestamp: fieldExtraction.createdAt,
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

