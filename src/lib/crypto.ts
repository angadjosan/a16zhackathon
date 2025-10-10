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

/**
 * Verify hash consistency for re-uploaded documents
 * @param originalHash - Original document hash
 * @param newHash - New document hash from re-upload
 * @returns Verification result with details
 */
export function verifyHashConsistency(
  originalHash: string, 
  newHash: string
): { verified: boolean; message: string; timestamp: string } {
  const timestamp = new Date().toISOString();
  
  if (!originalHash || !newHash) {
    return {
      verified: false,
      message: 'Invalid hash provided for verification',
      timestamp
    };
  }

  // Use secure comparison to prevent timing attacks
  const matches = secureCompare(originalHash, newHash);
  
  return {
    verified: matches,
    message: matches 
      ? 'Document verified! Hash matches original.' 
      : 'Document has been altered since original upload.',
    timestamp
  };
}

/**
 * Generate proof hash for a collection of field proofs (Merkle-like structure)
 * @param fieldProofs - Array of field proof hashes
 * @returns Combined proof hash
 */
export function generateProofCollection(fieldProofs: string[]): string {
  if (fieldProofs.length === 0) {
    return crypto.createHash('sha256').update('').digest('hex');
  }
  
  // Sort proofs for deterministic ordering
  const sortedProofs = [...fieldProofs].sort();
  
  // Create merkle-like root by hashing concatenated proofs
  const combinedProofs = sortedProofs.join('');
  return crypto.createHash('sha256').update(combinedProofs).digest('hex');
}

/**
 * Validate proof structure and integrity
 * @param proof - Proof object to validate
 * @returns Validation result
 */
export function validateProof(proof: {
  docHash: string;
  field: string;
  value: unknown;
  sourceText: string;
  confidence: number;
  timestamp: string;
}): { valid: boolean; error?: string } {
  try {
    // Check required fields
    if (!proof.docHash || !proof.field || !proof.timestamp) {
      return { valid: false, error: 'Missing required proof fields' };
    }

    // Validate hash format (64 character hex)
    if (!/^[a-f0-9]{64}$/i.test(proof.docHash)) {
      return { valid: false, error: 'Invalid document hash format' };
    }

    // Validate confidence range
    if (proof.confidence < 0 || proof.confidence > 1) {
      return { valid: false, error: 'Confidence must be between 0 and 1' };
    }

    // Validate timestamp
    const timestamp = new Date(proof.timestamp);
    if (isNaN(timestamp.getTime())) {
      return { valid: false, error: 'Invalid timestamp format' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Proof validation failed' };
  }
}
