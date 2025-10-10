/**
 * Shareable Proof URL Utility
 * Generate and parse shareable verification URLs
 */

export interface ShareableProofURL {
  fullUrl: string;
  shortUrl: string;
  proofId: string;
  qrCode?: string;
}

export interface ProofShareOptions {
  includeQR?: boolean;
  customDomain?: string;
  expiresIn?: number; // Expiration in seconds
  trackViews?: boolean;
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

  const result: ShareableProofURL = {
    fullUrl,
    shortUrl,
    proofId,
  };

  // Generate QR code if requested
  if (options.includeQR) {
    result.qrCode = generateQRCode(fullUrl);
  }

  return result;
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
 * Generate QR code data URL
 */
function generateQRCode(url: string): string {
  // In production, this would use a QR code library like 'qrcode'
  // For now, return a placeholder or use a QR code API
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    url
  )}`;
  return qrApiUrl;
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
 * Generate shareable text for proof
 */
export function generateShareableText(
  proofId: string,
  documentType: string = 'document'
): string {
  const url = generateShareableURL(proofId);

  return `🔐 Cryptographically Verified ${documentType}

This ${documentType} has been verified using TrustDocs.
View verification: ${url.fullUrl}

✓ Verified extraction
✓ Tamper-evident proofs
✓ Audit-ready records`;
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
 * Generate social media share URLs
 */
export function generateSocialShareURLs(proofId: string, documentType: string = 'document'): {
  twitter: string;
  linkedin: string;
  email: string;
} {
  const url = generateShareableURL(proofId);
  const text = `Check out this cryptographically verified ${documentType} on TrustDocs`;

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(
      url.fullUrl
    )}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url.fullUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(
      `Verified ${documentType}`
    )}&body=${encodeURIComponent(`${text}\n\n${url.fullUrl}`)}`,
  };
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
 * Generate markdown badge for proof
 */
export function generateMarkdownBadge(proofId: string, documentType: string = 'document'): string {
  const url = generateShareableURL(proofId);
  return `[![Verified on TrustDocs](https://img.shields.io/badge/Verified-TrustDocs-10b981)](${url.fullUrl})`;
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

/**
 * Share via Web Share API
 */
export async function shareViaWebAPI(proofId: string, documentType: string = 'document'): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return false;
  }

  const url = generateShareableURL(proofId);
  const text = generateShareableText(proofId, documentType);

  try {
    await navigator.share({
      title: `Verified ${documentType} - TrustDocs`,
      text,
      url: url.fullUrl,
    });
    return true;
  } catch {
    return false;
  }
}

