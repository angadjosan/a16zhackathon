import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { initDemoAuth } from '@/lib/auth';

// Types for API responses
interface ExtractionItem {
  id: string;
  doc_id: string;
  field: string;
  value: string | null;
  source_text: string | null;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  ocr_words: Array<{
    text: string;
    confidence: number;
    bounding_box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  model: string;
  confidence: number;
  proof_hash: string | null;
  created_at: string;
}

interface ExtractionsResponse {
  success: boolean;
  data?: ExtractionItem[];
  error?: string;
  meta?: {
    total_count: number;
    document_id: string;
    confidence_threshold?: number;
  };
}

// GET /api/extractions/:docId - Get all extractions for a document
export async function GET(
  request: NextRequest,
  { params }: { params: { docId: string } }
): Promise<NextResponse<ExtractionsResponse>> {
  try {
    // Initialize demo auth context
    const { user } = initDemoAuth();

    const docId = params.docId;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(docId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document ID format' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const confidenceThreshold = parseFloat(searchParams.get('confidence_threshold') || '0');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // First verify the document exists and belongs to user (in demo mode, skip user check)
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', docId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Build query for extractions
    let query = supabase
      .from('extractions')
      .select('*')
      .eq('doc_id', docId)
      .order('confidence', { ascending: true }) // Sort by confidence ASC (lowest first for review)
      .range(offset, offset + limit - 1);

    // Add confidence threshold filter if specified
    if (confidenceThreshold > 0) {
      query = query.gte('confidence', confidenceThreshold);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch extractions' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('extractions')
      .select('*', { count: 'exact', head: true })
      .eq('doc_id', docId);

    if (confidenceThreshold > 0) {
      countQuery = countQuery.gte('confidence', confidenceThreshold);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      success: true,
      data: data || [],
      meta: {
        total_count: count || 0,
        document_id: docId,
        ...(confidenceThreshold > 0 && { confidence_threshold: confidenceThreshold })
      }
    });

  } catch (error) {
    console.error('Extractions API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
