import { NextRequest, NextResponse } from 'next/server';
import { validateFileUpload, generateDocumentHash } from '@/lib/crypto';
import { uploadDocumentToStorage, insertDocument, getDocumentByHash } from '@/lib/supabase';
import { initDemoAuth } from '@/lib/auth';
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
  };
  error?: string;
}

// Configuration
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
const ALLOWED_TYPES = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf').split(',');

export async function POST(request: NextRequest): Promise<NextResponse<ApiUploadResponse>> {
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

    // Check if document already exists (same hash)
    const { data: existingDoc } = await getDocumentByHash(docHash);
    if (existingDoc) {
      return NextResponse.json({
        success: true,
        data: {
          fileId: existingDoc.id,
          filename: existingDoc.original_filename || file.name,
          timestamp: existingDoc.created_at,
          docHash: existingDoc.doc_hash,
          fileSize: existingDoc.file_size,
          mimeType: existingDoc.mime_type,
          imageUrl: existingDoc.image_url
        }
      });
    }

    // Upload file to Supabase Storage using our helper function
    const { imageUrl, error: uploadError } = await uploadDocumentToStorage(file, docHash);
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Generate unique document ID and timestamp
    const fileId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Store document metadata in database using our helper function
    const { data: docData, error: dbError } = await insertDocument({
      id: fileId,
      doc_hash: docHash,
      image_url: imageUrl,
      original_filename: file.name,
      file_size: file.size,
      mime_type: file.type,
      document_type: null, // Will be determined during extraction
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

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        fileId,
        filename: file.name,
        timestamp,
        docHash,
        fileSize: file.size,
        mimeType: file.type,
        imageUrl
      }
    });

  } catch (error) {
    console.error('Upload API error:', error);
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
