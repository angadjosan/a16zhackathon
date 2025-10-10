import { NextResponse } from 'next/server';
import { validateSupabaseConfig } from '@/lib/supabase';

export async function GET() {
  try {
    // Validate environment configuration
    validateSupabaseConfig();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'TrustDocs API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        supabase: 'configured',
        upload_api: 'available',
        file_limits: {
          max_size: process.env.MAX_FILE_SIZE || '10485760',
          allowed_types: process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf'
        }
      }
    };

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
