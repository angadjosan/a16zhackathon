import crypto from 'crypto';

/**
 * Generate SHA-256 hash for document integrity verification
 * @param buffer - File buffer to hash
 * @returns SHA-256 hash as hex string
 */
export function generateDocumentHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Validate file upload against security requirements
 * @param file - File object to validate
 * @returns Validation result with success/error
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png', 
    'application/pdf'
  ];
  
  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
  
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${allowedMimeTypes.join(', ')}`
    };
  }
  
  if (file.size > maxFileSize) {
    return {
      valid: false,
      error: `File too large: ${file.size} bytes. Maximum size: ${maxFileSize} bytes`
    };
  }
  
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty'
    };
  }
  
  return { valid: true };
}

/**
 * Create field-level proof for audit trail
 * @param docHash - Document hash
 * @param field - Field name
 * @param value - Extracted value
 * @param sourceText - Source text from OCR
 * @param confidence - Confidence score
 * @returns SHA-256 hash of proof data
 */
export function createFieldProof(
  docHash: string,
  field: string,
  value: unknown,
  sourceText: string,
  confidence: number
): string {
  const proofData = {
    docHash,
    field,
    value,
    sourceText,
    confidence,
    timestamp: new Date().toISOString()
  };
  
  return crypto.createHash('sha256')
    .update(JSON.stringify(proofData))
    .digest('hex');
}

/**
 * Secure comparison for document hashes to prevent timing attacks
 * @param a - First hash
 * @param b - Second hash
 * @returns True if hashes match
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(a, "hex"), 
      Buffer.from(b, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically secure random UUID
 * @returns UUID string
 */
export function generateSecureId(): string {
  return crypto.randomUUID();
}
