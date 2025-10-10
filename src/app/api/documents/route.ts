<<<<<<< HEAD
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
=======
/**
 * Documents Listing API Route
 * GET /api/documents
 * 
 * Retrieves a list of all processed documents with:
 * - Document metadata
 * - Extraction summaries
 * - Pagination support
 * - Filtering and sorting options
 */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

/**
 * GET /api/documents
 * List all processed documents with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);

    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '50', 10),
      100
    ); // Max 100
    const documentType = url.searchParams.get('type') as
      | 'receipt'
      | 'invoice'
      | 'contract'
      | null;
    const sortBy = url.searchParams.get('sort') || 'createdAt'; // createdAt, documentType, confidence
    const sortOrder = url.searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    console.log(`[Documents API] Listing documents`, {
      page,
      limit,
      documentType,
      sortBy,
      sortOrder,
    });

    // Get all documents from database
    const allDocuments = await database.listDocuments();

    if (!allDocuments || allDocuments.length === 0) {
      console.log(`[Documents API] No documents found`);
      return NextResponse.json(
        {
          success: true,
          data: {
            documents: [],
            pagination: {
              page: 1,
              limit,
              total: 0,
              totalPages: 0,
            },
          },
          message: 'No documents found. Upload a document to get started.',
        },
        { status: 200 }
      );
    }

    // Filter by document type if specified
    let filteredDocuments = allDocuments;
    if (documentType) {
      filteredDocuments = allDocuments.filter(
        (doc) => doc.documentType === documentType
      );
    }

    // Get extractions for each document to calculate confidence
    const documentsWithDetails = await Promise.all(
      filteredDocuments.map(async (doc) => {
        const extractions = await database.getExtractions(doc.id);
        const extractionCount = extractions?.length || 0;
        const averageConfidence =
          extractionCount > 0
            ? extractions!.reduce((sum, e) => sum + e.confidence, 0) / extractionCount
            : 0;

        return {
          id: doc.id,
          docHash: doc.docHash,
          imageUrl: doc.imageUrl,
          documentType: doc.documentType,
          merkleRoot: doc.merkleRoot,
          createdAt: doc.createdAt,
          extractionCount,
          averageConfidence: Math.round(averageConfidence * 100) / 100,
          proofId: doc.proofId,
        };
      })
    );

    // Sort documents
    documentsWithDetails.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'documentType':
          comparison = (a.documentType || '').localeCompare(b.documentType || '');
          break;
        case 'confidence':
          comparison = a.averageConfidence - b.averageConfidence;
          break;
        case 'createdAt':
        default:
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDocuments = documentsWithDetails.slice(startIndex, endIndex);

    const totalPages = Math.ceil(documentsWithDetails.length / limit);

    console.log(`[Documents API] Retrieved ${paginatedDocuments.length} documents`, {
      total: documentsWithDetails.length,
      page,
      totalPages,
    });

    // Return paginated list
    return NextResponse.json(
      {
        success: true,
        data: {
          documents: paginatedDocuments.map((doc) => ({
            id: doc.id,
            docHash: doc.docHash,
            imageUrl: doc.imageUrl,
            documentType: doc.documentType,
            extractionCount: doc.extractionCount,
            averageConfidence: doc.averageConfidence,
            createdAt: doc.createdAt,
            proofId: doc.proofId,
          })),
          pagination: {
            page,
            limit,
            total: documentsWithDetails.length,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
          filters: {
            documentType: documentType || 'all',
            sortBy,
            sortOrder,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Documents API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve documents. Please try again.',
      },
>>>>>>> main
      { status: 500 }
    );
  }
}
<<<<<<< HEAD
=======

/**
 * DELETE /api/documents
 * Clear all documents (for testing purposes)
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log(`[Documents API] Clearing all documents`);

    // Clear all data from database
    await database.clearAll();

    console.log(`[Documents API] All documents cleared successfully`);

    return NextResponse.json(
      {
        success: true,
        message: 'All documents cleared successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Documents API] Error clearing documents:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to clear documents. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/documents
 * Get API documentation
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {
      success: true,
      message: 'Documents Listing API',
      version: '1.0.0',
      endpoints: {
        GET: {
          description: 'List all processed documents with pagination',
          queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 50, max: 100)',
            type: 'Filter by document type: receipt | invoice | contract',
            sort: 'Sort by: createdAt | documentType | confidence (default: createdAt)',
            order: 'Sort order: asc | desc (default: desc)',
          },
          examples: [
            '/api/documents',
            '/api/documents?page=2&limit=20',
            '/api/documents?type=receipt',
            '/api/documents?sort=confidence&order=asc',
          ],
        },
        DELETE: {
          description: 'Clear all documents (for testing)',
          warning: 'This will permanently delete all documents and proofs',
        },
      },
    },
    { status: 200 }
  );
}

>>>>>>> main
