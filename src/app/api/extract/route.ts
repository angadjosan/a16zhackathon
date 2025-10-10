/**
 * Document Extraction API Route
 * POST /api/extract
 * 
 * Orchestrates the complete document extraction pipeline:
 * 1. Hash document
 * 2. Extract with Claude
 * 3. Generate Eigencompute proof
 * 4. Create field proofs
 * 5. Store in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractDocument } from '@/services/extractionService';
import { database } from '@/lib/database';
import { z } from 'zod';

// Request validation schema
const ExtractRequestSchema = z.object({
  docId: z.string().uuid(),
  imageBuffer: z.string(), // base64 encoded
  documentType: z.enum(['receipt', 'invoice', 'contract']).optional(),
});

/**
 * POST /api/extract
 * Extract structured data from a document with cryptographic proofs
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = ExtractRequestSchema.parse(body);

    const { docId, imageBuffer: base64Image, documentType } = validatedData;

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');

    console.log(`[Extract API] Processing document ${docId}`, {
      bufferSize: imageBuffer.length,
      documentType: documentType || 'auto-detect',
    });

    // Run extraction pipeline
    const startTime = Date.now();
    const result = await extractDocument(docId, imageBuffer, {
      documentType,
      autoDetect: !documentType,
    });

    const processingTime = Date.now() - startTime;

    console.log(`[Extract API] Extraction complete in ${processingTime}ms`, {
      docId,
      docHash: result.docHash.substring(0, 16) + '...',
      fieldsExtracted: result.extraction.fields.length,
      confidence: result.overallConfidence,
    });

    // Store complete proof in database
    const documentProof = result.documentProof;
    await database.storeCompleteDocumentProof(
      docId,
      result.docHash,
      `data:image/jpeg;base64,${base64Image}`, // Store as data URL
      documentProof
    );

    console.log(`[Extract API] Stored document proof in database`, {
      docId,
      proofId: result.eigencomputeProof.proofId,
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          docId,
          docHash: result.docHash,
          documentType: result.extraction.documentType,
          fields: result.extraction.fields.map((field) => ({
            field: field.field,
            value: field.value,
            sourceText: field.sourceText,
            confidence: field.confidence,
            proofHash: field.proofHash,
          })),
          fieldProofs: result.fieldProofs.map((proof) => ({
            field: proof.field,
            proofHash: proof.proofHash,
            eigencomputeProofId: proof.eigencomputeProofId,
          })),
          merkleRoot: result.merkleRoot,
          eigencomputeProof: {
            proofId: result.eigencomputeProof.proofId,
            attestation: result.eigencomputeProof.attestation,
            createdAt: result.eigencomputeProof.createdAt,
          },
          overallConfidence: result.overallConfidence,
          lowConfidenceFields: result.lowConfidenceFields,
          processingTime,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Extract API] Error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to extract document. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/extract
 * Get extraction status/info
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: true,
      message: 'Document extraction API',
      version: '1.0.0',
      endpoints: {
        POST: {
          description: 'Extract structured data from document',
          body: {
            docId: 'UUID of the document',
            imageBuffer: 'Base64 encoded image',
            documentType: 'receipt | invoice | contract (optional, auto-detects if omitted)',
          },
        },
      },
    },
    { status: 200 }
  );
}

