/**
 * Shareable Proof URL Utility
 * Generate and parse shareable verification URLs
 */

export interface ShareableProofURL {
  fullUrl: string;
  shortUrl: string;
  proofId: string;
}

export interface ProofShareOptions {
  customDomain?: string;
  expiresIn?: number; // Expiration in seconds
}

/**
 * Generate a shareable proof URL
 */
export function generateShareableURL(
  proofId: string,
  options: ProofShareOptions = {}
): ShareableProofURL {
  const baseUrl = options.customDomain || getBaseURL();
  const fullUrl = `${baseUrl}/verify/${proofId}`;

  // Generate short URL (in production, this would use a URL shortener service)
  const shortUrl = generateShortURL(proofId, baseUrl);

  return {
    fullUrl,
    shortUrl,
    proofId,
  };
}

/**
 * Get base URL from environment or window
 */
function getBaseURL(): string {
  // Server-side
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  // Client-side
  return window.location.origin;
}

/**
 * Generate a short URL for the proof
 */
function generateShortURL(proofId: string, baseUrl: string): string {
  // Take first 8 characters of proof ID for short URL
  const shortId = proofId.substring(0, 8);
  return `${baseUrl}/v/${shortId}`;
}


/**
 * Parse proof ID from URL
 */
export function parseProofIdFromURL(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Handle /verify/:proofId format
    if (pathParts.includes('verify')) {
      const index = pathParts.indexOf('verify');
      return pathParts[index + 1] || null;
    }

    // Handle /v/:shortId format
    if (pathParts.includes('v')) {
      const index = pathParts.indexOf('v');
      const shortId = pathParts[index + 1];
      // In production, lookup full proof ID from short ID
      return shortId || null;
    }

    return null;
  } catch {
    return null;
  }
}


/**
 * Generate shareable HTML embed code
 */
export function generateEmbedCode(proofId: string, options: { width?: number; height?: number } = {}): string {
  const width = options.width || 400;
  const height = options.height || 200;
  const baseUrl = getBaseURL();

  return `<iframe 
  src="${baseUrl}/embed/${proofId}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  style="border: 1px solid #e5e7eb; border-radius: 8px;"
  title="TrustDocs Verification Badge"
></iframe>`;
}


/**
 * Validate proof URL
 */
export function isValidProofURL(url: string): boolean {
  try {
    const proofId = parseProofIdFromURL(url);
    return proofId !== null && proofId.length > 0;
  } catch {
    return false;
  }
}


/**
 * Generate API URL for proof verification
 */
export function generateAPIURL(proofId: string): string {
  const baseUrl = getBaseURL();
  return `${baseUrl}/api/verify/public/${proofId}`;
}

/**
 * Copy URL to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}


