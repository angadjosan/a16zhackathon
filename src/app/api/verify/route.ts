<<<<<<< HEAD
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { initDemoAuth } from '@/lib/auth';
import { generateDocumentHash, verifyHashConsistency } from '@/lib/crypto';

// Types for verification API
interface VerificationRequest {
  document_id: string;
  file?: File; // Re-uploaded file for verification
}

interface VerificationResponse {
  success: boolean;
  data?: {
    document_id: string;
    verification_result: {
      verified: boolean;
      message: string;
      timestamp: string;
    };
    original_hash: string;
    new_hash?: string;
    extractions_verified?: boolean;
  };
  error?: string;
}

// POST /api/verify - Verify document integrity by re-upload
export async function POST(request: NextRequest): Promise<NextResponse<VerificationResponse>> {
  try {
    // Initialize demo auth context
    const { user } = initDemoAuth();

    const formData = await request.formData();
    const document_id = formData.get('document_id') as string;
    const file = formData.get('file') as File;

    if (!document_id) {
      return NextResponse.json(
        { success: false, error: 'document_id is required' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'file is required for verification' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get original document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Generate hash for re-uploaded file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const newHash = generateDocumentHash(fileBuffer);

    // Verify hash consistency
    const verificationResult = verifyHashConsistency(document.doc_hash, newHash);

    // Get extractions to verify they're still valid
    const { data: extractions } = await supabase
      .from('extractions')
      .select('*')
      .eq('doc_id', document_id);

    const extractionsVerified = extractions && extractions.length > 0;

    // Log verification attempt
    await supabase
      .from('audit_log')
      .insert({
        doc_id: document_id,
        action: 'document_verification',
        details: {
          original_hash: document.doc_hash,
          new_hash: newHash,
          verified: verificationResult.verified,
          extraction_count: extractions?.length || 0
        },
        timestamp: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      data: {
        document_id,
        verification_result: verificationResult,
        original_hash: document.doc_hash,
        new_hash: newHash,
        extractions_verified: extractionsVerified || false
      }
    });

  } catch (error) {
    console.error('Verify API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during verification' },
      { status: 500 }
    );
  }
}

// GET /api/verify/:docId - Get verification status for a document
export async function GET(
  request: NextRequest,
  { params }: { params: { docId: string } }
): Promise<NextResponse> {
  try {
    const { user } = initDemoAuth();
    const docId = params.docId;

    if (!docId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get document and its verification history
    const { data: document } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docId)
      .single();

    const { data: verificationHistory } = await supabase
      .from('audit_log')
      .select('*')
      .eq('doc_id', docId)
      .eq('action', 'document_verification')
      .order('created_at', { ascending: false });

    const { data: proofs } = await supabase
      .from('proofs')
      .select('*')
      .eq('doc_id', docId);

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
=======
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
>>>>>>> main
        { status: 404 }
      );
    }

<<<<<<< HEAD
    return NextResponse.json({
      success: true,
      data: {
        document_id: docId,
        document_hash: document.doc_hash,
        verification_history: verificationHistory || [],
        proofs: proofs || [],
        created_at: document.created_at
      }
    });

  } catch (error) {
    console.error('Get verification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
=======
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
>>>>>>> main
      { status: 500 }
    );
  }
}
<<<<<<< HEAD
=======

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

>>>>>>> main
