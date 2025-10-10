import { createServerClient } from '@/lib/supabase';
import { NextRequest } from 'next/server';

/**
 * Get the current authenticated user from the request
 * For demo purposes, we'll create a simple user session
 */
export async function getCurrentUser(request?: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // For hackathon demo, we'll create a simple demo user
    // In production, this would validate actual JWT tokens
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      // Create demo user for hackathon
      return {
        id: 'demo-user-id',
        email: 'demo@trustdocs.com',
        created_at: new Date().toISOString(),
        role: 'demo'
      };
    }
    
    return user;
  } catch (error) {
    console.error('Auth error:', error);
    // Fallback to demo user for hackathon
    return {
      id: 'demo-user-id',
      email: 'demo@trustdocs.com',
      created_at: new Date().toISOString(),
      role: 'demo'
    };
  }
}

/**
 * Middleware to require authentication for protected routes
 * For hackathon, this just returns the demo user
 */
export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return null;
  }
  
  return user;
}

/**
 * Initialize demo user context for all requests
 * This ensures we have a consistent user session for the hackathon
 */
export function initDemoAuth() {
  return {
    user: {
      id: 'demo-user-id',
      email: 'demo@trustdocs.com',
      created_at: new Date().toISOString(),
      role: 'demo'
    }
  };
}
