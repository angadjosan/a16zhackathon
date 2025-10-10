import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { validateFileUpload, generateDocumentHash } from '@/lib/crypto';
import { initDemoAuth } from '@/lib/auth';

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

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        duplex: 'half'
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    // Generate unique document ID
    const fileId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Store document metadata in database
    const { error: dbError } = await supabase
      .from('documents')
      .insert({
        id: fileId,
        doc_hash: docHash,
        image_url: publicUrl,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        document_type: null, // Will be determined during extraction
        created_at: timestamp,
        updated_at: timestamp
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([fileName]);
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
        imageUrl: publicUrl
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
