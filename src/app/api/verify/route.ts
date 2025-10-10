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
        { status: 404 }
      );
    }

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
      { status: 500 }
    );
  }
}
