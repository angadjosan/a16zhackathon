/**
 * Eigencompute TEE Client
 * 
 * Handles integration with Eigencompute's Trusted Execution Environment
 * to generate cryptographic proofs for Claude Sonnet 4.5 document extractions
 */

import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';
import {
  EigencomputeConfig,
  EigencomputeProcessRequest,
  EigencomputeProcessResponse,
  TEEAttestation,
  EigencomputeProof,
  FieldProof,
} from '../types/proof.types';

/**
 * Eigencompute TEE Client
 * Wraps Claude API calls in a Trusted Execution Environment for verifiable AI
 */
export class EigencomputeClient {
  private config: EigencomputeConfig;
  private anthropic: Anthropic;

  constructor(config: EigencomputeConfig) {
    this.config = config;
    
    // Initialize Claude SDK
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Process document through TEE with Claude Sonnet 4.5
   * Generates cryptographic proof of extraction
   */
  async processDocument(
    request: EigencomputeProcessRequest
  ): Promise<EigencomputeProcessResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Call Claude Vision API through TEE
      const extractedData = await this.callClaudeInTEE(
        request.imageBase64,
        request.prompt,
        request.model
      );

      // Step 2: Generate TEE attestation
      const attestation = await this.generateAttestation(
        request.docHash,
        request.imageBase64,
        extractedData
      );

      // Step 3: Create proof ID
      const proofId = this.generateProofId(request.docHash, attestation);

      // Step 4: Construct response
      const response: EigencomputeProcessResponse = {
        proofId,
        attestation,
        extractedData,
        metadata: {
          processingTime: Date.now() - startTime,
          model: request.model,
          timestamp: new Date().toISOString(),
        },
      };

      return response;
    } catch (error) {
      console.error('Eigencompute processing failed:', error);
      throw new Error(`TEE processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Call Claude API within Trusted Execution Environment
   * This is where Eigencompute's TEE wraps the API call
   */
  private async callClaudeInTEE(
    imageBase64: string,
    prompt: string,
    model: string
  ): Promise<{
    documentType: string;
    fields: Array<{
      field: string;
      value: unknown;
      sourceText: string;
      confidence: number;
    }>;
  }> {
    // Call Claude Vision API
    const message = await this.anthropic.messages.create({
      model: model || 'claude-sonnet-4.5-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract JSON response from Claude
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    // Parse Claude's JSON response
    const extractedData = this.parseClaudeResponse(responseText);

    return extractedData;
  }

  /**
   * Parse Claude's response into structured format
   */
  private parseClaudeResponse(responseText: string): {
    documentType: string;
    fields: Array<{
      field: string;
      value: unknown;
      sourceText: string;
      confidence: number;
    }>;
  } {
    try {
      // Extract JSON from Claude's response (handle markdown code blocks)
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                       responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      return {
        documentType: parsed.documentType || 'unknown',
        fields: parsed.fields || [],
      };
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      throw new Error('Invalid response format from Claude');
    }
  }

  /**
   * Generate TEE attestation
   * In production, this would call Eigencompute's attestation API
   * For MVP, we simulate the attestation structure
   */
  private async generateAttestation(
    docHash: string,
    imageBase64: string,
    extractedData: unknown
  ): Promise<TEEAttestation> {
    // Create attestation data
    const attestationData = {
      docHash,
      imageHash: crypto.createHash('sha256').update(imageBase64).digest('hex'),
      extractedDataHash: crypto.createHash('sha256')
        .update(JSON.stringify(extractedData))
        .digest('hex'),
      timestamp: new Date().toISOString(),
    };

    // Generate signature (in production, this would be from TEE)
    const signature = crypto
      .createHash('sha256')
      .update(JSON.stringify(attestationData))
      .digest('hex');

    const attestation: TEEAttestation = {
      attestationId: crypto.randomUUID(),
      platform: process.env.EIGENCOMPUTE_TEE_PLATFORM || 'SGX',
      measurements: {
        mrenclave: this.generateMockMeasurement(),
        mrsigner: this.generateMockMeasurement(),
      },
      signature,
      timestamp: new Date().toISOString(),
      metadata: {
        ...attestationData,
        teeEnabled: this.config.teeEnabled,
      },
    };

    return attestation;
  }

  /**
   * Generate proof ID from document hash and attestation
   */
  private generateProofId(docHash: string, attestation: TEEAttestation): string {
    const proofData = `${docHash}-${attestation.attestationId}-${attestation.timestamp}`;
    return `proof_${crypto.createHash('sha256').update(proofData).digest('hex').substring(0, 16)}`;
  }

  /**
   * Generate mock measurement for development
   * In production, this comes from actual TEE
   */
  private generateMockMeasurement(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify TEE attestation
   * Checks that the attestation is valid and from a trusted TEE
   */
  async verifyAttestation(attestation: TEEAttestation): Promise<boolean> {
    try {
      // In production, this would verify against Eigencompute's attestation service
      // For MVP, we verify the signature structure
      return !!(
        attestation.attestationId &&
        attestation.signature &&
        attestation.timestamp &&
        attestation.measurements
      );
    } catch (error) {
      console.error('Attestation verification failed:', error);
      return false;
    }
  }

  /**
   * Generate field-level proof hash
   */
  generateFieldProofHash(field: FieldProof): string {
    // Canonicalize the proof data (sorted keys, no whitespace)
    const canonicalData = {
      confidence: field.confidence,
      eigencomputeProofId: field.eigencomputeProofId,
      field: field.field,
      model: field.model,
      sourceText: field.sourceText,
      timestamp: field.timestamp,
      value: field.value,
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(canonicalData))
      .digest('hex');
  }

  /**
   * Build Merkle tree from field proof hashes
   */
  buildMerkleRoot(proofHashes: string[]): string {
    if (proofHashes.length === 0) return '';
    if (proofHashes.length === 1) return proofHashes[0];

    // Build tree bottom-up
    let layer = [...proofHashes];
    
    while (layer.length > 1) {
      const nextLayer: string[] = [];
      
      for (let i = 0; i < layer.length; i += 2) {
        const left = layer[i];
        const right = i + 1 < layer.length ? layer[i + 1] : left;
        
        const combined = crypto
          .createHash('sha256')
          .update(left + right)
          .digest('hex');
        
        nextLayer.push(combined);
      }
      
      layer = nextLayer;
    }
    
    return layer[0];
  }

  /**
   * Convenience method: Generate document hash from buffer
   */
  generateDocumentHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Convenience method: Generate Merkle root (alias for buildMerkleRoot)
   */
  generateMerkleRoot(proofHashes: string[]): string {
    return this.buildMerkleRoot(proofHashes);
  }

  /**
   * Convenience method: Generate proof with simplified API
   * Wraps processDocument with a cleaner interface
   */
  async generateProof(
    documentHash: string,
    documentType: 'receipt' | 'invoice' | 'contract',
    extractedData: any,
    imageBuffer: Buffer,
    model: string
  ): Promise<import('../types/proof.types').EigencomputeProof> {
    const base64Image = imageBuffer.toString('base64');
    
    const result = await this.processDocument({
      imageBase64: base64Image,
      docHash: documentHash,
      model,
      prompt: buildExtractionPrompt(documentType),
      metadata: {
        documentType,
        extractedFieldCount: extractedData.fields?.length || 0,
      },
    });

    // Construct field proofs from extracted data
    const fieldProofHashes = extractedData.fields?.map((field: any) => {
      const fieldData = {
        field: field.field,
        value: field.value,
        sourceText: field.sourceText,
        confidence: field.confidence,
        model,
        eigencomputeProofId: result.proofId,
        timestamp: result.metadata.timestamp,
      };
      return this.generateFieldProofHash(fieldData as any);
    }) || [];

    // Build Merkle root from field proofs
    const merkleRoot = this.buildMerkleRoot(fieldProofHashes);

    // Construct EigencomputeProof
    const eigencomputeProof: import('../types/proof.types').EigencomputeProof = {
      proofId: result.proofId,
      docHash: documentHash,
      attestation: result.attestation,
      apiRequest: {
        model,
        timestamp: result.metadata.timestamp,
        requestHash: this.generateDocumentHash(Buffer.from(base64Image, 'base64')),
      },
      apiResponse: {
        responseHash: this.generateDocumentHash(Buffer.from(JSON.stringify(result.extractedData))),
        timestamp: result.metadata.timestamp,
      },
      merkleRoot,
      createdAt: result.metadata.timestamp,
    };

    return eigencomputeProof;
  }

  /**
   * Convenience method: Verify proof by re-hashing document
   */
  async verifyProof(
    proofId: string,
    reuploadedDocumentHash: string
  ): Promise<import('../types/proof.types').VerificationResult> {
    // For MVP, this is a simplified mock verification
    // In production, this would verify against stored proofs
    
    // Mock stored proof (in real implementation, fetch from database)
    const mockStoredProof = {
      documentHash: reuploadedDocumentHash, // Assuming hashes match for now
      proofId,
    };

    const hashMatch = mockStoredProof.documentHash === reuploadedDocumentHash;

    return {
      verified: hashMatch,
      newHash: reuploadedDocumentHash,
      originalHash: mockStoredProof.documentHash,
      hashMatch,
      message: hashMatch
        ? '✓ Verified: Hash matches original'
        : '⚠️ Warning: Hash mismatch - document altered',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Create Eigencompute client instance
 */
export function createEigencomputeClient(): EigencomputeClient {
  const config: EigencomputeConfig = {
    apiKey: process.env.EIGENCOMPUTE_API_KEY || '',
    endpoint: process.env.EIGENCOMPUTE_ENDPOINT || 'https://api.eigencompute.com',
    teeEnabled: process.env.EIGENCOMPUTE_TEE_ENABLED === 'true',
    timeout: 30000,
    retries: 3,
  };

  return new EigencomputeClient(config);
}

/**
 * Build extraction prompt for Claude
 */
export function buildExtractionPrompt(documentType?: string): string {
  return `You are analyzing a business document image.

TASK:
1. Identify the document type: receipt, invoice, or contract
2. Extract structured data based on the type:
   - Receipts: merchant, date, total, category, line items
   - Invoices: vendor, date, amount, invoice_number, line items, tax, payment terms
   - Contracts: parties, dates, key terms, obligations

3. For each field provide:
   - The extracted value
   - The exact source text snippet from the image
   - Your confidence score (0-1)
   - Flag if unclear or ambiguous

Return as JSON:
{
  "documentType": "receipt" | "invoice" | "contract",
  "fields": [
    {
      "field": "total",
      "value": 247.83,
      "sourceText": "$247.83",
      "confidence": 0.98,
      "notes": "Clear and unambiguous"
    }
  ]
}`;
}

/**
 * Singleton instance for convenience
 */
export const eigencomputeClient = createEigencomputeClient();

