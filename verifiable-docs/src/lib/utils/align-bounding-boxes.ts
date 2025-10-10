import {
  OCRWord,
  OCRResult,
  ExtractedField,
  BoundingBox,
  ClaudeExtraction,
  DocumentProcessingError
} from '@/types/document.types';

/**
 * Calculate string similarity using Levenshtein distance
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score between 0 and 1 (1 = identical)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}

/**
 * Clean and normalize text for better matching
 * @param text - Raw text
 * @returns Cleaned text
 */
function cleanTextForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\$\.\,\-]/g, '') // Keep alphanumeric, spaces, and common punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find the best matching OCR words for a given source text
 * @param sourceText - Text from Claude extraction
 * @param ocrWords - Array of OCR words with bounding boxes
 * @param threshold - Minimum similarity threshold (default: 0.6)
 * @returns Array of matching OCR words with match quality
 */
function findMatchingOCRWords(
  sourceText: string,
  ocrWords: OCRWord[],
  threshold: number = 0.6
): Array<{ word: OCRWord; similarity: number; matchType: 'exact' | 'partial' | 'fuzzy' }> {
  const cleanedSource = cleanTextForMatching(sourceText);
  const matches: Array<{ word: OCRWord; similarity: number; matchType: 'exact' | 'partial' | 'fuzzy' }> = [];

  // Strategy 1: Exact match
  const exactMatch = ocrWords.find(word => 
    cleanTextForMatching(word.text) === cleanedSource
  );
  if (exactMatch) {
    return [{ word: exactMatch, similarity: 1.0, matchType: 'exact' }];
  }

  // Strategy 2: Partial match (source text contains or is contained in OCR word)
  for (const word of ocrWords) {
    const cleanedWord = cleanTextForMatching(word.text);
    
    if (cleanedSource.includes(cleanedWord) || cleanedWord.includes(cleanedSource)) {
      const similarity = Math.max(
        cleanedSource.length / cleanedWord.length,
        cleanedWord.length / cleanedSource.length
      ) * 0.9; // Slight penalty for partial matches
      
      if (similarity >= threshold) {
        matches.push({ word, similarity, matchType: 'partial' });
      }
    }
  }

  if (matches.length > 0) {
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  // Strategy 3: Multi-word fuzzy matching
  const sourceWords = cleanedSource.split(/\s+/);
  const windowSize = Math.min(sourceWords.length + 2, 5); // Dynamic window size

  for (let i = 0; i <= ocrWords.length - sourceWords.length; i++) {
    const window = ocrWords.slice(i, i + windowSize);
    const windowText = cleanTextForMatching(
      window.map(w => w.text).join(' ')
    );

    const similarity = calculateStringSimilarity(cleanedSource, windowText);
    
    if (similarity >= threshold) {
      // Add all words in the matching window
      window.forEach(word => {
        matches.push({ word, similarity, matchType: 'fuzzy' });
      });
    }
  }

  // Strategy 4: Individual word fuzzy matching (fallback)
  if (matches.length === 0) {
    for (const word of ocrWords) {
      const similarity = calculateStringSimilarity(
        cleanedSource,
        cleanTextForMatching(word.text)
      );
      
      if (similarity >= threshold) {
        matches.push({ word, similarity, matchType: 'fuzzy' });
      }
    }
  }

  // Remove duplicates and sort by similarity
  const uniqueMatches = matches.filter((match, index, self) => 
    index === self.findIndex(m => m.word === match.word)
  );

  return uniqueMatches.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Combine bounding boxes from multiple OCR words
 * @param ocrWords - Array of OCR words
 * @returns Combined bounding box
 */
function combineBoundingBoxes(ocrWords: OCRWord[]): BoundingBox {
  if (ocrWords.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  if (ocrWords.length === 1) {
    return ocrWords[0].boundingBox;
  }

  // Find the bounding rectangle that encompasses all words
  let minX = Number.MAX_VALUE;
  let minY = Number.MAX_VALUE;
  let maxX = Number.MIN_VALUE;
  let maxY = Number.MIN_VALUE;

  for (const word of ocrWords) {
    const { x, y, width, height } = word.boundingBox;
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculate combined confidence score from multiple OCR words
 * @param ocrWords - Array of OCR words
 * @param baseConfidence - Base confidence from Claude
 * @param matchQuality - Quality of the match (0-1)
 * @returns Combined confidence score
 */
function calculateCombinedConfidence(
  ocrWords: OCRWord[],
  baseConfidence: number,
  matchQuality: number
): number {
  if (ocrWords.length === 0) {
    return baseConfidence * 0.5; // Penalty for no OCR match
  }

  // Average OCR confidence
  const avgOcrConfidence = ocrWords.reduce(
    (sum, word) => sum + word.confidence, 0
  ) / ocrWords.length;

  // Combine confidences with weights
  const combinedConfidence = (
    baseConfidence * 0.4 +           // 40% Claude confidence
    avgOcrConfidence * 0.4 +         // 40% OCR confidence
    matchQuality * 0.2               // 20% matching quality
  );

  // Apply penalty for poor matches
  if (matchQuality < 0.8) {
    return combinedConfidence * 0.9; // 10% penalty
  }

  return Math.min(combinedConfidence, 1.0);
}

/**
 * Align Claude extraction results with Google Vision OCR bounding boxes
 * @param claudeResult - Result from Claude Vision API
 * @param ocrResult - Result from Google Vision OCR
 * @returns Enhanced extraction with bounding box information
 */
export function alignBoundingBoxes(
  claudeResult: ClaudeExtraction,
  ocrResult: OCRResult
): ClaudeExtraction {
  try {
    const enhancedFields: ExtractedField[] = [];

    for (const field of claudeResult.fields) {
      // Find matching OCR words for this field's source text
      const matches = findMatchingOCRWords(field.sourceText, ocrResult.words);
      
      let enhancedField: ExtractedField = { ...field };

      if (matches.length > 0) {
        // Use the best matches (top matches with similar quality)
        const bestSimilarity = matches[0].similarity;
        const bestMatches = matches.filter(
          match => match.similarity >= bestSimilarity * 0.95
        );

        const matchedWords = bestMatches.map(match => match.word);
        
        // Calculate combined bounding box
        const combinedBoundingBox = combineBoundingBoxes(matchedWords);
        
        // Calculate enhanced confidence
        const matchQuality = bestMatches.length > 0 ? bestMatches[0].similarity : 0;
        const enhancedConfidence = calculateCombinedConfidence(
          matchedWords,
          field.confidence,
          matchQuality
        );

        enhancedField = {
          ...field,
          confidence: enhancedConfidence,
          boundingBox: combinedBoundingBox,
          ocrWords: matchedWords,
        };

        console.log(`✅ Aligned field "${field.name}": ${field.sourceText} -> ${matchedWords.length} OCR words (confidence: ${enhancedConfidence.toFixed(2)})`);
      } else {
        // No OCR match found - apply penalty but keep the field
        enhancedField = {
          ...field,
          confidence: field.confidence * 0.6, // Significant penalty for no match
        };

        console.log(`⚠️  No OCR match for field "${field.name}": ${field.sourceText}`);
      }

      enhancedFields.push(enhancedField);
    }

    return {
      ...claudeResult,
      fields: enhancedFields,
    };

  } catch (error) {
    console.error('Error aligning bounding boxes:', error);
    throw new DocumentProcessingError(
      'Failed to align Claude results with OCR bounding boxes',
      'ALIGNMENT_ERROR',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Validate alignment results and flag potential issues
 * @param alignedResult - Result after bounding box alignment
 * @returns Validation report
 */
export function validateAlignment(alignedResult: ClaudeExtraction) {
  const report = {
    totalFields: alignedResult.fields.length,
    fieldsWithBoundingBoxes: 0,
    averageConfidence: 0,
    lowConfidenceFields: [] as string[],
    unalignedFields: [] as string[],
  };

  let confidenceSum = 0;

  for (const field of alignedResult.fields) {
    confidenceSum += field.confidence;

    if (field.boundingBox) {
      report.fieldsWithBoundingBoxes++;
    } else {
      report.unalignedFields.push(field.name);
    }

    if (field.confidence < 0.7) {
      report.lowConfidenceFields.push(field.name);
    }
  }

  report.averageConfidence = report.totalFields > 0 
    ? confidenceSum / report.totalFields 
    : 0;

  return report;
}

/**
 * Get alignment statistics for debugging
 * @param alignedResult - Result after alignment
 * @returns Statistics object
 */
export function getAlignmentStatistics(alignedResult: ClaudeExtraction) {
  const stats = {
    totalFields: alignedResult.fields.length,
    alignedFields: alignedResult.fields.filter(f => f.boundingBox).length,
    averageConfidence: 0,
    confidenceDistribution: {
      high: 0,   // >= 0.9
      medium: 0, // 0.7 - 0.9
      low: 0,    // < 0.7
    },
  };

  let confidenceSum = 0;

  for (const field of alignedResult.fields) {
    confidenceSum += field.confidence;

    if (field.confidence >= 0.9) {
      stats.confidenceDistribution.high++;
    } else if (field.confidence >= 0.7) {
      stats.confidenceDistribution.medium++;
    } else {
      stats.confidenceDistribution.low++;
    }
  }

  stats.averageConfidence = stats.totalFields > 0 
    ? confidenceSum / stats.totalFields 
    : 0;

  return stats;
}