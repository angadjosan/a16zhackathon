import { NextRequest, NextResponse } from 'next/server';
import { validateFileUpload, generateDocumentHash, createFieldProof } from '@/lib/crypto';
import { uploadDocumentToStorage, insertDocument, getDocumentByHash } from '@/lib/supabase';
import { initDemoAuth } from '@/lib/auth';
import { createEigencomputeClient } from '@/utils/eigencompute';
import crypto from 'crypto';

// Types for upload response
interface ApiUploadResponse {
  success: boolean;
  data?: {
    fileId: string;
    filename: string;
    timestamp: string;
    docHash: string;
    fileSize: number;
    mimeType: string;
    imageUrl: string;
    documentType: string;
    extractedFields: Array<{
      field: string;
      value: string | number;
      sourceText: string;
      boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      confidence: number;
      proofHash: string;
    }>;
    processingTime: number;
  };
  error?: string;
}

// Configuration
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
const ALLOWED_TYPES = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf').split(',');

export async function POST(request: NextRequest): Promise<NextResponse<ApiUploadResponse>> {
  const startTime = Date.now();
  
  try {
    // Initialize demo auth context for hackathon
    const { user } = initDemoAuth();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type and size
    const validation = validateFileUpload(file);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Convert file to buffer and generate hash
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const docHash = generateDocumentHash(buffer);

    console.log(`🔄 Starting complete upload flow for document`);
    console.log(`📊 File size: ${buffer.length} bytes`);
    console.log(`🔐 Document hash: ${docHash}`);

    // Check if document already exists (same hash)
    try {
      const { data: existingDoc } = await getDocumentByHash(docHash);
      if (existingDoc) {
        console.log('📄 Document already exists, fetching existing data');
        
        // Fetch existing extractions for this document
        const { createClient } = await import('@/lib/supabase');
        const supabase = createClient();
        
        const { data: extractions, error: extractionsError } = await supabase
          .from('extractions')
          .select('*')
          .eq('doc_id', existingDoc.id);
        
        if (extractionsError) {
          console.error('Error fetching existing extractions:', extractionsError);
        }
        
        // Convert database extractions to frontend format
        const extractedFields = extractions?.map(extraction => ({
          field: extraction.field,
          value: extraction.value,
          sourceText: extraction.source_text,
          boundingBox: extraction.bounding_box,
          confidence: extraction.confidence,
          proofHash: extraction.proof_hash
        })) || [];
        
        return NextResponse.json({
          success: true,
          data: {
            fileId: existingDoc.id,
            filename: existingDoc.original_filename || file.name,
            timestamp: existingDoc.created_at,
            docHash: existingDoc.doc_hash,
            fileSize: existingDoc.file_size,
            mimeType: existingDoc.mime_type,
            imageUrl: existingDoc.image_url,
            documentType: existingDoc.document_type || 'unknown',
            extractedFields: extractedFields,
            ocrData: {
              words: [],
              text: '',
              confidence: 0
            },
            processingTime: 0
          }
        });
      }
    } catch (error) {
      console.error('Database check error:', error);
      return NextResponse.json(
        { success: false, error: 'Database configuration error. Please check your Supabase settings.' },
        { status: 500 }
      );
    }

    // Upload file to Supabase Storage
    let imageUrl: string;
    try {
      const { imageUrl: uploadedImageUrl, error: uploadError } = await uploadDocumentToStorage(file, docHash);
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return NextResponse.json(
          { success: false, error: 'Failed to upload file to storage' },
          { status: 500 }
        );
      }
      imageUrl = uploadedImageUrl;
    } catch (error) {
      console.error('Storage configuration error:', error);
      return NextResponse.json(
        { success: false, error: 'Storage configuration error. Please check your Supabase settings.' },
        { status: 500 }
      );
    }

    // Generate unique document ID and timestamp
    const fileId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // ===== EIGENCOMPUTE TEE EXECUTION =====
    console.log('🔒 Starting Eigencompute TEE execution...');

    // Initialize Eigencompute client
    const eigencomputeClient = createEigencomputeClient();
    
    // Step 1: Process document through Eigencompute TEE
    console.log('1️⃣  Processing document through Eigencompute TEE...');
    const teeStartTime = Date.now();
    
    const eigencomputeResult = await eigencomputeClient.processDocument({
      imageBase64: buffer.toString('base64'),
      docHash: docHash,
      model: 'claude-sonnet-4.5-20241022',
      prompt: `You are analyzing a business document image.

TASK:
1. Identify the document type: receipt, invoice, or contract
2. Extract structured data based on the type:
   - Receipts: merchant, date, total, category, line items
   - Invoices: vendor, date, amount, invoice_number, line items, tax, payment terms
   - Contracts: parties, dates, key terms, obligations

3. For each field provide:
   - The extracted value
   - The exact source text snippet from the image
   - Your confidence score (0-1)
   - Flag if unclear or ambiguous

Return as JSON:
{
  "documentType": "receipt" | "invoice" | "contract",
  "fields": [
    {
      "field": "total",
      "value": 247.83,
      "sourceText": "$247.83",
      "confidence": 0.98,
      "notes": "Clear and unambiguous"
    }
  ]
}`,
      metadata: {
        documentType: 'receipt',
        extractedFieldCount: 0,
      },
    });
    
    const teeTime = Date.now() - teeStartTime;
    console.log(`✅ Eigencompute TEE processing completed in ${teeTime}ms`);
    console.log(`📋 Document type: ${eigencomputeResult.extractedData.documentType}`);
    console.log(`📊 Extracted ${eigencomputeResult.extractedData.fields.length} fields`);
    console.log(`🔐 Proof ID: ${eigencomputeResult.proofId}`);

    // Step 2: Generate Field Proofs using Eigencompute attestation
    console.log('2️⃣  Generating field proofs with TEE attestation...');
    const proofStartTime = Date.now();
    
    const extractedFieldsWithProofs = eigencomputeResult.extractedData.fields.map(field => {
      // Create complete FieldProof object for Eigencompute
      const fieldProof: import('@/types/proof.types').FieldProof = {
        field: field.field,
        value: field.value,
        sourceText: field.sourceText,
        boundingBox: undefined, // No bounding boxes without OCR
        ocrWords: undefined, // No OCR words
        confidence: field.confidence,
        model: 'claude-sonnet-4.5-20241022',
        proofHash: '', // Will be generated below
        eigencomputeProofId: eigencomputeResult.proofId,
        timestamp: eigencomputeResult.metadata.timestamp,
      };
      
      // Generate the proof hash using the complete FieldProof object
      const fieldProofHash = eigencomputeClient.generateFieldProofHash(fieldProof);
      
      return {
        field: field.field,
        value: field.value as string | number,
        sourceText: field.sourceText,
        boundingBox: undefined, // No bounding boxes without OCR
        confidence: field.confidence,
        proofHash: fieldProofHash
      };
    });
    
    const proofTime = Date.now() - proofStartTime;
    console.log(`✅ TEE proof generation completed in ${proofTime}ms`);

    // ===== END EIGENCOMPUTE TEE EXECUTION =====

    // Step 5: Store in Supabase
    console.log('5️⃣  Storing results in database...');
    const storageStartTime = Date.now();

    // Store document metadata
    try {
      const { data: docData, error: dbError } = await insertDocument({
        id: fileId,
        doc_hash: docHash,
        image_url: imageUrl,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        document_type: eigencomputeResult.extractedData.documentType as 'receipt' | 'invoice' | 'contract',
        ocr_data: null, // OCR removed from flow
        claude_data: {
          extraction: eigencomputeResult.extractedData,
          rawResponse: JSON.stringify(eigencomputeResult.extractedData),
          usage: {
            inputTokens: 0, // TEE doesn't expose token usage
            outputTokens: 0
          }
        },
        created_at: timestamp,
        updated_at: timestamp
      });

      if (dbError) {
        console.error('Database insert error:', dbError);
        return NextResponse.json(
          { success: false, error: 'Failed to save document metadata' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Database insert configuration error:', error);
      return NextResponse.json(
        { success: false, error: 'Database configuration error. Please check your Supabase settings.' },
        { status: 500 }
      );
    }

    // Store field extractions with proofs
    try {
      const { createClient } = await import('@/lib/supabase');
      const supabase = createClient();
      
      const fieldInserts = extractedFieldsWithProofs.map(field => ({
        doc_id: fileId,
        field: field.field,
        value: String(field.value),
        source_text: field.sourceText,
        bounding_box: field.boundingBox || null,
        ocr_words: null, // OCR removed from flow
        model: 'claude-sonnet-4.5-20241022',
        confidence: field.confidence,
        proof_hash: field.proofHash,
        created_at: timestamp
      }));

      const { error: fieldsError } = await supabase
        .from('extractions')
        .insert(fieldInserts);

      if (fieldsError) {
        console.error('❌ Failed to store field extractions:', fieldsError);
        // Don't throw here, we can still return the results
      }
    } catch (error) {
      console.error('❌ Failed to store field extractions:', error);
      // Don't throw here, we can still return the results
    }

    const storageTime = Date.now() - storageStartTime;
    console.log(`✅ Storage completed in ${storageTime}ms`);

    // Calculate total processing time
    const totalProcessingTime = Date.now() - startTime;
    
    console.log(`🎉 Complete upload flow finished in ${totalProcessingTime}ms`);
    console.log(`📊 Performance breakdown:`);
    console.log(`   TEE Processing: ${teeTime}ms (${((teeTime / totalProcessingTime) * 100).toFixed(1)}%)`);
    console.log(`   Proofs: ${proofTime}ms (${((proofTime / totalProcessingTime) * 100).toFixed(1)}%)`);
    console.log(`   Storage: ${storageTime}ms (${((storageTime / totalProcessingTime) * 100).toFixed(1)}%)`);

    // Return success response with extracted data
    return NextResponse.json({
      success: true,
      data: {
        fileId,
        filename: file.name,
        timestamp,
        docHash,
        fileSize: file.size,
        mimeType: file.type,
        imageUrl,
        documentType: eigencomputeResult.extractedData.documentType,
        extractedFields: extractedFieldsWithProofs,
        ocrData: {
          words: [],
          text: '',
          confidence: 0
        },
        processingTime: totalProcessingTime
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Upload flow failed after ${processingTime}ms:`, error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error during file upload' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'healthy',
    service: 'upload-api',
    timestamp: new Date().toISOString()
  });
}
