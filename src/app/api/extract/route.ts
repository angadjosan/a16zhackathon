import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { analyzeDocumentWithClaude } from '@/utils/claudeExtraction';
import { extractTextWithBoundingBoxes } from '@/utils/googleVision';
import { alignBoundingBoxes } from '@/utils/alignBoundingBoxes';
import { generateDocumentHash } from '@/lib/crypto';
import { initDemoAuth } from '@/lib/auth';

// Types for extraction response
interface ApiExtractionResponse {
  success: boolean;
  data?: {
    documentId: string;
    documentType: string;
    processingTime: number;
    extractedFields: ExtractedFieldWithAlignment[];
    ocrResults: {
      fullText: string;
      confidence: number;
      wordCount: number;
    };
    metadata: {
      timestamp: string;
      model: string;
      docHash: string;
    };
  };
  error?: string;
  progress?: {
    stage: 'uploading' | 'ocr' | 'extraction' | 'alignment' | 'completed';
    message: string;
    percentage: number;
  };
}

interface ExtractedFieldWithAlignment {
  name: string;
  value: string | number;
  sourceText: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  aligned: boolean;
  matchType: 'exact' | 'fuzzy' | 'partial' | 'none';
  ocrWords: any[];
}

/**
 * Hour 6 - API Route Integration: /api/extract
 * Handles complete document processing pipeline: image → OCR → Claude → alignment → response
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiExtractionResponse>> {
  const startTime = Date.now();
  
  try {
    // Initialize demo auth context for hackathon
    const { user } = initDemoAuth();
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Parse request data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentId = formData.get('documentId') as string;

    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No file provided for extraction' 
        },
        { status: 400 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Document ID is required for extraction' 
        },
        { status: 400 }
      );
    }

    // Convert file to buffer for processing
    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    
    // Generate document hash for integrity
    const docHash = generateDocumentHash(imageBuffer);

    console.log(`🔄 Starting extraction pipeline for document ${documentId}`);
    console.log(`📊 File size: ${imageBuffer.length} bytes`);
    console.log(`🔐 Document hash: ${docHash}`);

    // Step 1: Google Vision OCR Processing
    console.log('1️⃣  Running Google Vision OCR...');
    const ocrStartTime = Date.now();
    
    const ocrResults = await extractTextWithBoundingBoxes(imageBuffer);
    const ocrTime = Date.now() - ocrStartTime;
    
    console.log(`✅ OCR completed in ${ocrTime}ms`);
    // Calculate average OCR confidence from words
    const avgOcrConfidence = ocrResults.words.length > 0 
      ? ocrResults.words.reduce((sum, word) => sum + word.confidence, 0) / ocrResults.words.length 
      : 0;
    console.log(`📝 Extracted ${ocrResults.words.length} words with ${(avgOcrConfidence * 100).toFixed(1)}% confidence`);

    // Step 2: Claude AI Extraction
    console.log('2️⃣  Running Claude AI extraction...');
    const claudeStartTime = Date.now();
    
    const claudeResults = await analyzeDocumentWithClaude(
      imageBuffer,
      file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    );
    const claudeTime = Date.now() - claudeStartTime;
    
    console.log(`✅ Claude extraction completed in ${claudeTime}ms`);
    console.log(`📋 Document type: ${claudeResults.documentType}`);
    console.log(`📊 Extracted ${claudeResults.fields.length} fields`);

    // Step 3: Bounding Box Alignment
    console.log('3️⃣  Aligning bounding boxes...');
    const alignmentStartTime = Date.now();
    
    // Convert Claude results to expected format for alignment
    const fieldsForAlignment = claudeResults.fields.map(field => ({
      name: field.name,
      value: field.value,
      sourceText: field.sourceText,
      confidence: field.confidence
    }));
    
    const alignmentResults = await alignBoundingBoxes(fieldsForAlignment, ocrResults.words);
    const alignmentTime = Date.now() - alignmentStartTime;
    
    // Transform to expected interface format with 'aligned' property
    const extractedFieldsWithAlignment: ExtractedFieldWithAlignment[] = alignmentResults.map(field => ({
      ...field,
      aligned: field.matchType !== 'none' && field.boundingBox !== undefined
    }));
    
    console.log(`✅ Alignment completed in ${alignmentTime}ms`);

    // Step 4: Store results in database
    console.log('4️⃣  Storing extraction results...');
    const storageStartTime = Date.now();

    // Insert extraction record
    const { data: extractionRecord, error: extractionError } = await supabase
      .from('extractions')
      .insert({
        doc_id: documentId,
        model: 'claude-3-5-sonnet-20241022',
        confidence: claudeResults.fields.reduce((sum, f) => sum + f.confidence, 0) / claudeResults.fields.length,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (extractionError) {
      console.error('❌ Failed to store extraction record:', extractionError);
      throw new Error(`Failed to store extraction: ${extractionError.message}`);
    }

    // Insert individual field extractions
    const fieldInserts = extractedFieldsWithAlignment.map(field => ({
      doc_id: documentId,
      field: field.name,
      value: String(field.value),
      source_text: field.sourceText,
      bounding_box: field.boundingBox || null,
      ocr_words: ocrResults.words.filter(word => 
        field.sourceText.includes(word.text) || word.text.includes(String(field.value))
      ),
      model: 'claude-3-5-sonnet-20241022',
      confidence: field.confidence,
      created_at: new Date().toISOString()
    }));

    const { error: fieldsError } = await supabase
      .from('extractions')
      .insert(fieldInserts);

    if (fieldsError) {
      console.error('❌ Failed to store field extractions:', fieldsError);
      // Don't throw here, we can still return the results
    }

    const storageTime = Date.now() - storageStartTime;
    console.log(`✅ Storage completed in ${storageTime}ms`);

    // Calculate total processing time
    const totalProcessingTime = Date.now() - startTime;
    
    // Prepare response
    const response: ApiExtractionResponse = {
      success: true,
      data: {
        documentId,
        documentType: claudeResults.documentType,
        processingTime: totalProcessingTime,
        extractedFields: extractedFieldsWithAlignment,
        ocrResults: {
          fullText: ocrResults.fullText,
          confidence: avgOcrConfidence,
          wordCount: ocrResults.words.length
        },
        metadata: {
          timestamp: new Date().toISOString(),
          model: 'claude-3-5-sonnet-20241022',
          docHash
        }
      }
    };

    console.log(`🎉 Extraction pipeline completed in ${totalProcessingTime}ms`);
    console.log(`📊 Performance breakdown:`);
    console.log(`   OCR: ${ocrTime}ms (${((ocrTime / totalProcessingTime) * 100).toFixed(1)}%)`);
    console.log(`   Claude: ${claudeTime}ms (${((claudeTime / totalProcessingTime) * 100).toFixed(1)}%)`);
    console.log(`   Alignment: ${alignmentTime}ms (${((alignmentTime / totalProcessingTime) * 100).toFixed(1)}%)`);
    console.log(`   Storage: ${storageTime}ms (${((storageTime / totalProcessingTime) * 100).toFixed(1)}%)`);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`❌ Extraction pipeline failed after ${processingTime}ms:`, errorMessage);
    
    // Return structured error response
    return NextResponse.json(
      {
        success: false,
        error: `Extraction failed: ${errorMessage}`,
        progress: {
          stage: 'completed' as const,
          message: `Failed after ${processingTime}ms`,
          percentage: 0
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for extraction status/results
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Fetch extraction results
    const { data: extractions, error } = await supabase
      .from('extractions')
      .select('*')
      .eq('doc_id', documentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch extractions: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        documentId,
        extractions: extractions || [],
        total: extractions?.length || 0
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Error handler with graceful degradation
 */
function handleExtractionError(error: unknown, stage: string): ApiExtractionResponse {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  console.error(`❌ Extraction failed at ${stage}:`, errorMessage);
  
  return {
    success: false,
    error: `${stage} failed: ${errorMessage}`,
    progress: {
      stage: 'completed',
      message: `Failed during ${stage}`,
      percentage: 0
    }
  };
}