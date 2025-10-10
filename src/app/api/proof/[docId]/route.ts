import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { initDemoAuth } from '@/lib/auth';

// Types for document proofs API
interface DocumentProofsResponse {
  success: boolean;
  data?: {
    document_id: string;
    document_hash: string;
    collection_proof?: string;
    field_proofs: Array<{
      field: string;
      proof_hash: string;
      value: string | null;
      source_text: string | null;
      confidence: number;
      created_at: string;
    }>;
    verification_summary: {
      total_fields: number;
      verified_fields: number;
      verification_rate: number;
    };
  };
  error?: string;
}

// GET /api/proof/[docId] - Get all proofs for a document
export async function GET(
  request: NextRequest,
  { params }: { params: { docId: string } }
): Promise<NextResponse<DocumentProofsResponse>> {
  try {
    // Initialize demo auth context
    const { user } = initDemoAuth();

    const { docId } = params;

    if (!docId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format for docId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(docId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document ID format' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get document to ensure it exists and get doc_hash
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('doc_hash')
      .eq('id', docId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get all extractions with proofs for this document
    const { data: extractions, error: extractionsError } = await supabase
      .from('extractions')
      .select('field, proof_hash, value, source_text, confidence, created_at')
      .eq('doc_id', docId)
      .order('created_at', { ascending: true });

    if (extractionsError) {
      console.error('Error fetching extractions:', extractionsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch document proofs' },
        { status: 500 }
      );
    }

    if (!extractions || extractions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No proofs found for this document' },
        { status: 404 }
      );
    }

    // Get collection proof from proofs table
    const { data: collectionProofData } = await supabase
      .from('proofs')
      .select('merkle_root')
      .eq('doc_id', docId)
      .single();

    // Format field proofs
    const fieldProofs = extractions.map(extraction => ({
      field: extraction.field,
      proof_hash: extraction.proof_hash || '',
      value: extraction.value,
      source_text: extraction.source_text,
      confidence: parseFloat(extraction.confidence?.toString() || '0'),
      created_at: extraction.created_at
    }));

    // Calculate verification summary
    const verifiedFields = fieldProofs.filter(proof => proof.proof_hash).length;
    const verificationRate = extractions.length > 0 ? verifiedFields / extractions.length : 0;

    return NextResponse.json({
      success: true,
      data: {
        document_id: docId,
        document_hash: document.doc_hash,
        collection_proof: collectionProofData?.merkle_root,
        field_proofs: fieldProofs,
        verification_summary: {
          total_fields: extractions.length,
          verified_fields: verifiedFields,
          verification_rate: Math.round(verificationRate * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error('Document proofs API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during proof retrieval' },
      { status: 500 }
    );
  }
}
