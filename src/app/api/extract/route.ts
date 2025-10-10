import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { initDemoAuth } from '@/lib/auth';
import { 
  generateDocumentHash, 
  createFieldProof, 
  generateProofCollection,
  validateProof,
  verifyHashConsistency 
} from '@/lib/crypto';

// Types for extraction API
interface ExtractionRequest {
  document_id: string;
  fields?: string[]; // Specific fields to extract
  include_confidence?: boolean;
  include_bounding_boxes?: boolean;
}

interface ExtractionResponse {
  success: boolean;
  data?: {
    document_id: string;
    document_type: 'receipt' | 'invoice' | 'contract';
    extractions: Array<{
      id: string;
      field: string;
      value: string | null;
      source_text: string | null;
      bounding_box: any | null;
      ocr_words: any | null;
      model: string;
      confidence: number;
      proof_hash: string | null;
      created_at: string;
    }>;
    processing_time_ms: number;
  };
  error?: string;
}

// POST /api/extract - Trigger AI extraction for a document
export async function POST(request: NextRequest): Promise<NextResponse<ExtractionResponse>> {
  try {
    // Initialize demo auth context
    const { user } = initDemoAuth();

    const body = await request.json() as ExtractionRequest;
    const { document_id } = body;

    if (!document_id) {
      return NextResponse.json(
        { success: false, error: 'document_id is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const supabase = createClient();

    // Get document details
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

    // Check if extractions already exist
    const { data: existingExtractions } = await supabase
      .from('extractions')
      .select('*')
      .eq('doc_id', document_id);

    if (existingExtractions && existingExtractions.length > 0) {
      // Return existing extractions
      const processingTime = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        data: {
          document_id,
          document_type: document.document_type || 'receipt',
          extractions: existingExtractions,
          processing_time_ms: processingTime
        }
      });
    }

    // TODO: Integration with Angad's AI extraction functions
    // For now, return mock extractions for Hour 2 completion
    const mockExtractions = generateMockExtractions(document);

    // Generate and validate proofs for each extraction
    const extractionsToInsert = [];
    const fieldProofs = [];

    for (const extraction of mockExtractions) {
      // Create field-level proof
      const proofHash = createFieldProof(
        document.doc_hash,
        extraction.field,
        extraction.value,
        extraction.source_text || '',
        extraction.confidence
      );

      // Validate proof structure
      const proofData = {
        docHash: document.doc_hash,
        field: extraction.field,
        value: extraction.value,
        sourceText: extraction.source_text || '',
        confidence: extraction.confidence,
        timestamp: new Date().toISOString()
      };

      const validation = validateProof(proofData);
      if (!validation.valid) {
        console.error(`Proof validation failed for field ${extraction.field}:`, validation.error);
        return NextResponse.json(
          { success: false, error: `Proof validation failed: ${validation.error}` },
          { status: 500 }
        );
      }

      fieldProofs.push(proofHash);
      extractionsToInsert.push({
        doc_id: document_id,
        field: extraction.field,
        value: extraction.value,
        source_text: extraction.source_text,
        bounding_box: extraction.bounding_box,
        ocr_words: extraction.ocr_words,
        model: extraction.model,
        confidence: extraction.confidence,
        proof_hash: proofHash
      });
    }

    // Generate collection proof (Merkle-like root)
    const collectionProof = generateProofCollection(fieldProofs);

    // Insert extractions into database with transaction
    const { data: insertedExtractions, error: insertError } = await supabase
      .from('extractions')
      .insert(extractionsToInsert)
      .select('*');

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to save extractions' },
        { status: 500 }
      );
    }

    // Create proof record for the collection
    const { error: proofError } = await supabase
      .from('proofs')
      .insert({
        doc_id: document_id,
        proof_data: {
          document_hash: document.doc_hash,
          field_proofs: fieldProofs,
          extraction_count: fieldProofs.length,
          model: 'claude-sonnet-3.5',
          timestamp: new Date().toISOString()
        },
        merkle_root: collectionProof,
        verification_status: 'verified'
      });

    if (proofError) {
      console.error('Proof insert error:', proofError);
      // Don't fail the request, just log the error
    }

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to save extractions' },
        { status: 500 }
      );
    }

    const processingTime = Date.now() - startTime;

    // Enhanced success response with proof details
    return NextResponse.json({
      success: true,
      data: {
        document_id,
        document_type: document.document_type || 'receipt',
        extractions: insertedExtractions || [],
        processing_time_ms: processingTime,
        proof_summary: {
          collection_proof: collectionProof,
          field_count: fieldProofs.length,
          all_verified: true,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Extract API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during extraction' },
      { status: 500 }
    );
  }
}

// Mock extraction function for Hour 2 testing
function generateMockExtractions(document: any) {
  const isReceipt = document.original_filename?.toLowerCase().includes('receipt') || 
                   document.document_type === 'receipt';

  if (isReceipt) {
    return [
      {
        field: 'vendor',
        value: 'Sample Store Inc.',
        source_text: 'SAMPLE STORE INC.',
        bounding_box: { x: 100, y: 50, width: 200, height: 30 },
        ocr_words: [
          { text: 'SAMPLE', confidence: 0.98, bounding_box: { x: 100, y: 50, width: 60, height: 30 } },
          { text: 'STORE', confidence: 0.97, bounding_box: { x: 165, y: 50, width: 55, height: 30 } },
          { text: 'INC.', confidence: 0.95, bounding_box: { x: 225, y: 50, width: 35, height: 30 } }
        ],
        model: 'claude-sonnet-3.5',
        confidence: 0.97
      },
      {
        field: 'total',
        value: '$24.83',
        source_text: 'TOTAL: $24.83',
        bounding_box: { x: 200, y: 300, width: 100, height: 25 },
        ocr_words: [
          { text: 'TOTAL:', confidence: 0.99, bounding_box: { x: 200, y: 300, width: 60, height: 25 } },
          { text: '$24.83', confidence: 0.98, bounding_box: { x: 265, y: 300, width: 55, height: 25 } }
        ],
        model: 'claude-sonnet-3.5',
        confidence: 0.98
      },
      {
        field: 'date',
        value: '2025-10-10',
        source_text: '10/10/2025',
        bounding_box: { x: 50, y: 80, width: 80, height: 20 },
        ocr_words: [
          { text: '10/10/2025', confidence: 0.94, bounding_box: { x: 50, y: 80, width: 80, height: 20 } }
        ],
        model: 'claude-sonnet-3.5',
        confidence: 0.94
      }
    ];
  }

  // Default mock for other document types
  return [
    {
      field: 'amount',
      value: '$100.00',
      source_text: 'Amount: $100.00',
      bounding_box: { x: 150, y: 200, width: 120, height: 25 },
      ocr_words: [
        { text: 'Amount:', confidence: 0.96, bounding_box: { x: 150, y: 200, width: 70, height: 25 } },
        { text: '$100.00', confidence: 0.97, bounding_box: { x: 225, y: 200, width: 65, height: 25 } }
      ],
      model: 'claude-sonnet-3.5',
      confidence: 0.96
    }
  ];
}
