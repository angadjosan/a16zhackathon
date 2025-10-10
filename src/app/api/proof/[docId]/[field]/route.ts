import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { initDemoAuth } from '@/lib/auth';

// Types for proof retrieval API
interface ProofResponse {
  success: boolean;
  data?: {
    proof_hash: string;
    field: string;
    value: string | null;
    source_text: string | null;
    bounding_box: any | null;
    confidence: number;
    document_hash: string;
    created_at: string;
    verification_status: 'verified' | 'pending' | 'failed';
  };
  error?: string;
}

// GET /api/proof/[docId]/[field] - Get specific field proof
export async function GET(
  request: NextRequest,
  { params }: { params: { docId: string; field: string } }
): Promise<NextResponse<ProofResponse>> {
  try {
    // Initialize demo auth context
    const { user } = initDemoAuth();

    const { docId, field } = params;

    if (!docId || !field) {
      return NextResponse.json(
        { success: false, error: 'Document ID and field are required' },
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

    // Get specific field extraction with proof
    const { data: extraction, error: extractionError } = await supabase
      .from('extractions')
      .select('*')
      .eq('doc_id', docId)
      .eq('field', field)
      .single();

    if (extractionError || !extraction) {
      return NextResponse.json(
        { success: false, error: 'Field proof not found' },
        { status: 404 }
      );
    }

    // Check if proof_hash exists
    if (!extraction.proof_hash) {
      return NextResponse.json(
        { success: false, error: 'Proof hash not generated for this field' },
        { status: 404 }
      );
    }

    // Return proof details
    return NextResponse.json({
      success: true,
      data: {
        proof_hash: extraction.proof_hash,
        field: extraction.field,
        value: extraction.value,
        source_text: extraction.source_text,
        bounding_box: extraction.bounding_box,
        confidence: parseFloat(extraction.confidence.toString()),
        document_hash: document.doc_hash,
        created_at: extraction.created_at,
        verification_status: 'verified' // All proofs are verified upon creation
      }
    });

  } catch (error) {
    console.error('Proof retrieval API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during proof retrieval' },
      { status: 500 }
    );
  }
}
