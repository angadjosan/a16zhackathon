import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { initDemoAuth } from '@/lib/auth';
import sharp from 'sharp';

// Types for API responses
interface RegionResponse {
  success: boolean;
  data?: {
    croppedImage: string; // base64 encoded image
    originalBoundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    field: string;
    confidence: number;
  };
  error?: string;
}

// GET /api/regions/:docId/:field - Get cropped image region for a specific field
export async function GET(
  request: NextRequest,
  { params }: { params: { docId: string; field: string } }
): Promise<NextResponse<RegionResponse | Blob>> {
  try {
    // Initialize demo auth context
    const { user } = initDemoAuth();

    const { docId, field } = params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(docId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document ID format' },
        { status: 400 }
      );
    }

    // Validate field name
    if (!field || field.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Field name is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get document information
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, image_url')
      .eq('id', docId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get extraction with bounding box for the specific field
    const { data: extraction, error: extractionError } = await supabase
      .from('extractions')
      .select('field, value, bounding_box, confidence')
      .eq('doc_id', docId)
      .eq('field', field)
      .single();

    if (extractionError || !extraction) {
      return NextResponse.json(
        { success: false, error: 'Field extraction not found' },
        { status: 404 }
      );
    }

    // Check if bounding box exists
    if (!extraction.bounding_box) {
      return NextResponse.json(
        { success: false, error: 'No bounding box data available for this field' },
        { status: 404 }
      );
    }

    const boundingBox = extraction.bounding_box as {
      x: number;
      y: number;
      width: number;
      height: number;
    };

    // Validate bounding box coordinates
    if (boundingBox.width <= 0 || boundingBox.height <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid bounding box coordinates' },
        { status: 400 }
      );
    }

    // Get query parameters for output format
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'base64'; // 'base64' or 'image'
    const padding = parseInt(searchParams.get('padding') || '10'); // Padding around bounding box

    // Fetch the original image
    let imageBuffer: Buffer;
    try {
      const imageResponse = await fetch(document.image_url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch original document image' },
        { status: 500 }
      );
    }

    // Get original image dimensions
    const imageMetadata = await sharp(imageBuffer).metadata();
    const originalWidth = imageMetadata.width || 0;
    const originalHeight = imageMetadata.height || 0;

    if (originalWidth === 0 || originalHeight === 0) {
      return NextResponse.json(
        { success: false, error: 'Unable to determine image dimensions' },
        { status: 500 }
      );
    }

    // Calculate crop coordinates with padding
    const cropX = Math.max(0, boundingBox.x - padding);
    const cropY = Math.max(0, boundingBox.y - padding);
    const cropWidth = Math.min(
      originalWidth - cropX,
      boundingBox.width + (padding * 2)
    );
    const cropHeight = Math.min(
      originalHeight - cropY,
      boundingBox.height + (padding * 2)
    );

    // Crop the image using sharp
    const croppedImageBuffer = await sharp(imageBuffer)
      .extract({
        left: Math.round(cropX),
        top: Math.round(cropY),
        width: Math.round(cropWidth),
        height: Math.round(cropHeight)
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Return based on requested format
    if (format === 'image') {
      // Return raw image data
      return new NextResponse(croppedImageBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': croppedImageBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
    } else {
      // Return base64 encoded image with metadata
      const base64Image = croppedImageBuffer.toString('base64');
      
      return NextResponse.json({
        success: true,
        data: {
          croppedImage: `data:image/jpeg;base64,${base64Image}`,
          originalBoundingBox: boundingBox,
          field: extraction.field,
          confidence: extraction.confidence,
        }
      });
    }

  } catch (error) {
    console.error('Region cropping API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
