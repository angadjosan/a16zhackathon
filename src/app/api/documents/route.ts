import { NextRequest, NextResponse } from 'next/server';
import { getDocumentByHash, createClient } from '@/lib/supabase';
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
  };
  error?: string;
}

interface DocumentsListResponse {
  success: boolean;
  data?: Array<{
    id: string;
    doc_hash: string;
    image_url: string;
    original_filename: string | null;
    file_size: number;
    mime_type: string;
    document_type: 'receipt' | 'invoice' | 'contract' | null;
    created_at: string;
    updated_at: string;
    extraction_count: number;
  }>;
  error?: string;
}

// GET /api/documents - Get all documents for user
export async function GET(request: NextRequest): Promise<NextResponse<DocumentsListResponse>> {
  try {
    // Initialize demo auth context
    const { user } = initDemoAuth();

    const supabase = createClient();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const documentType = searchParams.get('type');
    const sortBy = searchParams.get('sort') || 'created_at';
    const sortOrder = searchParams.get('order') || 'desc';

    // Build query with extraction count
    let query = supabase
      .from('documents')
      .select(`
        *,
        extraction_count:extractions(count)
      `)
      .range(offset, offset + limit - 1)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Add type filter if specified
    if (documentType && ['receipt', 'invoice', 'contract'].includes(documentType)) {
      query = query.eq('document_type', documentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    // Format the response data to include extraction count
    const formattedData = (data || []).map(doc => ({
      ...doc,
      extraction_count: doc.extraction_count?.[0]?.count || 0
    }));

    return NextResponse.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Documents API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
