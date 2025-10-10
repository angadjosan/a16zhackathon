import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { initDemoAuth } from '@/lib/auth';

// Types for API responses
interface DocumentResponse {
  success: boolean;
  data?: {
    id: string;
    doc_hash: string;
    image_url: string;
    original_filename: string | null;
    file_size: number;
    mime_type: string;
    document_type: 'receipt' | 'invoice' | 'contract' | null;
    created_at: string;
    updated_at: string;
    extractions?: Array<{
      id: string;
      field: string;
      value: string | null;
      source_text: string | null;
      confidence: number;
      proof_hash: string | null;
    }>;
  };
  error?: string;
}

// GET /api/documents/[id] - Get specific document with extractions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<DocumentResponse>> {
  try {
    // Initialize demo auth context
    const { user } = initDemoAuth();

    const supabase = createClient();
    const documentId = params.id;

    // Get document with extractions
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        *,
        extractions (
          id,
          field,
          value,
          source_text,
          confidence,
          proof_hash
        )
      `)
      .eq('id', documentId)
      .single();

    if (docError) {
      if (docError.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        );
      }
      
      console.error('Database query error:', docError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('Document API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete document and all related data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    // Initialize demo auth context
    const { user } = initDemoAuth();

    const supabase = createClient();
    const documentId = params.id;

    // Get document to check if it exists and get storage info
    const { data: document, error: getError } = await supabase
      .from('documents')
      .select('id, image_url')
      .eq('id', documentId)
      .single();

    if (getError) {
      if (getError.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        );
      }
      
      console.error('Database query error:', getError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch document' },
        { status: 500 }
      );
    }

    // Delete document (cascades to extractions and proofs)
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    // TODO: Also delete file from storage
    // Extract filename from URL and delete from storage bucket
    // This would be implemented in production but skipped for hackathon

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Document delete API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
