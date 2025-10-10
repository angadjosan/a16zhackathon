/**
 * Public Verification API Route
 * GET /api/verify/public/[proofId]
 * 
 * Publicly accessible endpoint for verifying document proofs
 * Does not expose sensitive data - only verification metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { verificationHistory } from '@/lib/verificationHistory';

interface PublicProofInfo {
  proofId: string;
  verified: boolean;
  status: 'verified' | 'pending' | 'failed';
  documentType: string;
  fieldCount: number;
  extractionTimestamp: string;
  verificationTimestamp: string | null;
  model: string;
  platform: string;
  confidenceScore: {
    average: number;
    min: number;
    max: number;
  };
  verificationHistory: {
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    lastVerificationTime: string | null;
  };
  metadata: {
    attestationId: string;
    merkleRoot: string;
  };
}

/**
 * GET /api/verify/public/[proofId]
 * Get public verification information for a proof
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { proofId: string } }
) {
  try {
    const { proofId } = params;

    console.log(`[Public Verify API] Retrieving proof: ${proofId}`);

    // Retrieve proof metadata from database
    const proofMetadata = await database.getProofMetadata(proofId);

    if (!proofMetadata) {
      return NextResponse.json(
        {
          success: false,
          error: 'Proof not found',
          message: 'The requested proof does not exist or has been removed.',
        },
        { status: 404 }
      );
    }

    // Get the associated document
    const document = await database.getDocument(proofMetadata.docId);

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: 'Document not found',
          message: 'The document associated with this proof was not found.',
        },
        { status: 404 }
      );
    }

    // Get document proof for field information
    const documentProof = await database.getDocumentProof(proofMetadata.docId);

    if (!documentProof) {
      return NextResponse.json(
        {
          success: false,
          error: 'Document proof not found',
        },
        { status: 404 }
      );
    }

    // Get verification history
    const history = verificationHistory.getSummary(proofMetadata.docId);

    // Calculate confidence statistics
    const confidenceScores = documentProof.fields.map((f) => f.confidence);
    const averageConfidence =
      confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length;
    const minConfidence = Math.min(...confidenceScores);
    const maxConfidence = Math.max(...confidenceScores);

    // Determine verification status
    const isVerified = documentProof.fields.every((f) => f.confidence >= 0.8);
    const status: 'verified' | 'pending' | 'failed' = isVerified
      ? 'verified'
      : documentProof.fields.some((f) => f.confidence < 0.5)
      ? 'failed'
      : 'pending';

    // Build public proof information (no sensitive data)
    const publicInfo: PublicProofInfo = {
      proofId,
      verified: isVerified,
      status,
      documentType: documentProof.documentType || 'document',
      fieldCount: documentProof.fields.length,
      extractionTimestamp: documentProof.createdAt,
      verificationTimestamp: history?.lastVerificationTime || null,
      model: proofMetadata.model,
      platform: proofMetadata.platform,
      confidenceScore: {
        average: Math.round(averageConfidence * 100) / 100,
        min: Math.round(minConfidence * 100) / 100,
        max: Math.round(maxConfidence * 100) / 100,
      },
      verificationHistory: {
        totalVerifications: history?.totalVerifications || 0,
        successfulVerifications: history?.successfulVerifications || 0,
        failedVerifications: history?.failedVerifications || 0,
        lastVerificationTime: history?.lastVerificationTime || null,
      },
      metadata: {
        attestationId: proofMetadata.attestationId,
        merkleRoot: documentProof.merkleRoot || '',
      },
    };

    console.log(`[Public Verify API] Proof retrieved successfully:`, {
      proofId,
      status,
      fieldCount: publicInfo.fieldCount,
    });

    // Return public information
    return NextResponse.json(
      {
        success: true,
        data: publicInfo,
        message: isVerified
          ? '✓ Verified: This document has been cryptographically verified'
          : '⚠️ Verification pending or failed',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      }
    );
  } catch (error) {
    console.error('[Public Verify API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve verification information. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/verify/public/[proofId]
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

