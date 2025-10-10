/**
 * Batch Verification API Route
 * POST /api/verify/batch
 * 
 * Verify multiple documents at once for efficiency
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyDocument } from '@/services/extractionService';
import { database } from '@/lib/database';
import { z } from 'zod';

// Request validation schema
const BatchVerifyRequestSchema = z.object({
  documents: z.array(
    z.object({
      docId: z.string().uuid(),
      imageBuffer: z.string(), // base64 encoded
    })
  ).min(1).max(10), // Allow 1-10 documents per batch
});

/**
 * POST /api/verify/batch
 * Verify multiple documents in a single request
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = BatchVerifyRequestSchema.parse(body);

    console.log(`[Batch Verify API] Processing ${validatedData.documents.length} documents`);

    const startTime = Date.now();
    
    // Process each document verification
    const results = await Promise.all(
      validatedData.documents.map(async ({ docId, imageBuffer: base64Image }) => {
        try {
          // Convert base64 to buffer
          const imageBuffer = Buffer.from(base64Image, 'base64');

          // Retrieve original document
          const originalDoc = await database.getDocument(docId);

          if (!originalDoc) {
            return {
              docId,
              success: false,
              error: 'Document not found',
              verified: false,
            };
          }

          // Get original proof metadata
          const proofMetadata = await database.getProofMetadata(originalDoc.proofId);

          if (!proofMetadata) {
            return {
              docId,
              success: false,
              error: 'Proof metadata not found',
              verified: false,
            };
          }

          // Verify the document
          const verificationResult = await verifyDocument(
            docId,
            imageBuffer,
            proofMetadata.proofId,
            originalDoc.docHash
          );

          return {
            docId,
            success: true,
            verified: verificationResult.verified,
            hashMatch: verificationResult.hashMatch,
            attestationValid: verificationResult.attestationValid,
            fieldProofsValid: verificationResult.fieldProofsValid,
            tamperedFields: verificationResult.tamperedFields || [],
            originalHash: verificationResult.originalHash,
            newHash: verificationResult.newHash,
            message: verificationResult.verified
              ? '✓ Verified: Document hash matches original'
              : '⚠️ Warning: Document hash does not match original',
          };
        } catch (error) {
          console.error(`[Batch Verify API] Error verifying document ${docId}:`, error);
          return {
            docId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            verified: false,
          };
        }
      })
    );

    const processingTime = Date.now() - startTime;

    // Calculate summary statistics
    const successCount = results.filter((r) => r.success).length;
    const verifiedCount = results.filter((r) => r.verified).length;
    const failedCount = results.filter((r) => !r.verified && r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    console.log(`[Batch Verify API] Complete in ${processingTime}ms`, {
      total: results.length,
      verified: verifiedCount,
      failed: failedCount,
      errors: errorCount,
    });

    // Return batch results
    return NextResponse.json(
      {
        success: true,
        data: {
          summary: {
            total: results.length,
            processed: successCount,
            verified: verifiedCount,
            failed: failedCount,
            errors: errorCount,
            processingTime,
          },
          results,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Batch Verify API] Error:', error);

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
        message: 'Failed to verify documents. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verify/batch
 * Get batch verification API info
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: true,
      message: 'Batch verification API',
      version: '1.0.0',
      endpoints: {
        POST: {
          description: 'Verify multiple documents at once',
          body: {
            documents: 'Array of {docId, imageBuffer} objects (1-10 documents)',
          },
          limits: {
            minDocuments: 1,
            maxDocuments: 10,
            maxPayloadSize: '50MB',
          },
          response: {
            summary: {
              total: 'Total documents in batch',
              processed: 'Successfully processed documents',
              verified: 'Documents that passed verification',
              failed: 'Documents that failed verification',
              errors: 'Documents with processing errors',
              processingTime: 'Total time in milliseconds',
            },
            results: 'Array of individual verification results',
          },
        },
      },
      example: {
        request: {
          documents: [
            {
              docId: '550e8400-e29b-41d4-a716-446655440000',
              imageBuffer: 'base64_string_1',
            },
            {
              docId: '660f9511-f40c-52e5-b827-557766551111',
              imageBuffer: 'base64_string_2',
            },
          ],
        },
        response: {
          summary: {
            total: 2,
            processed: 2,
            verified: 2,
            failed: 0,
            errors: 0,
            processingTime: 345,
          },
          results: [
            {
              docId: '550e8400-e29b-41d4-a716-446655440000',
              success: true,
              verified: true,
              message: '✓ Verified: Document hash matches original',
            },
            {
              docId: '660f9511-f40c-52e5-b827-557766551111',
              success: true,
              verified: true,
              message: '✓ Verified: Document hash matches original',
            },
          ],
        },
      },
    },
    { status: 200 }
  );
}

