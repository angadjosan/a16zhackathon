/**
 * Document Verification API Route
 * POST /api/verify
 * 
 * Verifies a re-uploaded document against the original stored proof:
 * 1. Re-hash the uploaded document
 * 2. Compare with original hash
 * 3. Return verification result
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyDocument } from '@/services/extractionService';
import { database } from '@/lib/database';
import { z } from 'zod';

// Request validation schema
const VerifyRequestSchema = z.object({
  docId: z.string().uuid(),
  imageBuffer: z.string(), // base64 encoded
});

/**
 * POST /api/verify
 * Verify a re-uploaded document against the original proof
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = VerifyRequestSchema.parse(body);

    const { docId, imageBuffer: base64Image } = validatedData;

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');

    console.log(`[Verify API] Verifying document ${docId}`, {
      bufferSize: imageBuffer.length,
    });

    // Retrieve original document from database
    const originalDoc = await database.getDocument(docId);

    if (!originalDoc) {
      console.warn(`[Verify API] Document not found: ${docId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Document not found',
          message: `No document found with ID: ${docId}`,
        },
        { status: 404 }
      );
    }

    console.log(`[Verify API] Original document found`, {
      docId,
      originalHash: originalDoc.docHash.substring(0, 16) + '...',
      createdAt: originalDoc.createdAt,
    });

    // Get original proof metadata
    const proofMetadata = await database.getProofMetadata(originalDoc.proofId);

    if (!proofMetadata) {
      console.warn(`[Verify API] Proof metadata not found for document: ${docId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Proof metadata not found',
          message: 'Original proof metadata missing. Document may be corrupted.',
        },
        { status: 404 }
      );
    }

    // Verify the document
    const startTime = Date.now();
    const verificationResult = await verifyDocument(
      docId,
      imageBuffer,
      proofMetadata.proofId,
      originalDoc.docHash
    );

    const verificationTime = Date.now() - startTime;

    console.log(`[Verify API] Verification complete in ${verificationTime}ms`, {
      docId,
      verified: verificationResult.verified,
      hashMatch: verificationResult.hashMatch,
    });

    // Return verification result
    return NextResponse.json(
      {
        success: true,
        data: {
          docId,
          verified: verificationResult.verified,
          hashMatch: verificationResult.hashMatch,
          newHash: verificationResult.newHash,
          originalHash: verificationResult.originalHash,
          message: verificationResult.verified
            ? '✓ Verified: Document hash matches original'
            : '⚠️ Warning: Document hash does not match original',
          attestationValid: verificationResult.attestationValid,
          fieldProofsValid: verificationResult.fieldProofsValid,
          tamperedFields: verificationResult.tamperedFields || [],
          originalTimestamp: originalDoc.createdAt,
          verificationTimestamp: verificationResult.timestamp,
          verificationTime,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Verify API] Error:', error);

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
        message: 'Failed to verify document. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verify
 * Get verification API info
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: true,
      message: 'Document verification API',
      version: '1.0.0',
      endpoints: {
        POST: {
          description: 'Verify a re-uploaded document against original proof',
          body: {
            docId: 'UUID of the original document',
            imageBuffer: 'Base64 encoded image of re-uploaded document',
          },
          response: {
            verified: 'boolean - true if hashes match',
            hashMatch: 'boolean - true if document hashes match',
            newHash: 'SHA-256 hash of re-uploaded document',
            originalHash: 'SHA-256 hash of original document',
            message: 'Human-readable verification message',
            attestationValid: 'boolean - TEE attestation validity',
            fieldProofsValid: 'boolean - all field proofs valid',
            tamperedFields: 'array - list of tampered fields (if any)',
          },
        },
      },
      howItWorks: [
        '1. Re-hash the uploaded document using SHA-256',
        '2. Compare new hash with original stored hash',
        '3. Verify TEE attestation is valid',
        '4. Check all field proofs are intact',
        '5. Return detailed verification result',
      ],
    },
    { status: 200 }
  );
}

