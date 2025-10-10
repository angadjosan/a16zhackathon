import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPG, PNG, or PDF.' },
        { status: 400 }
      );
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // For now, we'll just return a mock response
    // In a real implementation, we would:
    // 1. Generate a document hash (SHA-256)
    // 2. Upload the file to storage
    // 3. Create a database record
    // 4. Return document details

    return NextResponse.json({
      docId: 'doc-' + Math.floor(Math.random() * 1000),
      originalFilename: file.name,
      fileSize: file.size,
      mimeType: file.type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}