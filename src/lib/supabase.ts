import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Database types
export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
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
        Insert: {
          id?: string;
          doc_hash: string;
          image_url: string;
          original_filename?: string | null;
          file_size: number;
          mime_type: string;
          document_type?: 'receipt' | 'invoice' | 'contract' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          doc_hash?: string;
          image_url?: string;
          original_filename?: string | null;
          file_size?: number;
          mime_type?: string;
          document_type?: 'receipt' | 'invoice' | 'contract' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      extractions: {
        Row: {
          id: string;
          doc_id: string;
          field: string;
          value: string | null;
          source_text: string | null;
          bounding_box: any | null; // JSON type
          ocr_words: any | null; // JSON type
          model: string;
          confidence: number;
          proof_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          doc_id: string;
          field: string;
          value?: string | null;
          source_text?: string | null;
          bounding_box?: any | null;
          ocr_words?: any | null;
          model?: string;
          confidence: number;
          proof_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          doc_id?: string;
          field?: string;
          value?: string | null;
          source_text?: string | null;
          bounding_box?: any | null;
          ocr_words?: any | null;
          model?: string;
          confidence?: number;
          proof_hash?: string | null;
          created_at?: string;
        };
      };
      proofs: {
        Row: {
          id: string;
          extraction_id: string;
          proof_data: any; // JSON type
          merkle_root: string | null;
          verification_status: 'pending' | 'verified' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          extraction_id: string;
          proof_data: any;
          merkle_root?: string | null;
          verification_status?: 'pending' | 'verified' | 'failed';
          created_at?: string;
        };
        Update: {
          id?: string;
          extraction_id?: string;
          proof_data?: any;
          merkle_root?: string | null;
          verification_status?: 'pending' | 'verified' | 'failed';
          created_at?: string;
        };
      };
    };
  };
}

// Client-side Supabase client
export const createClient = () => {
  return createClientComponentClient<Database>();
};

// Server-side Supabase client
export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies });
};

// Environment validation
export const validateSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return { url, anonKey };
};
