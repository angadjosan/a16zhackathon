import { OCRWord } from '../types/document.types';

/**
 * Enhanced field result with bounding box alignment
 */
export interface AlignedField {
  name: string;
  value: string | number;
  sourceText: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  ocrWords: OCRWord[];
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'partial' | 'none';
  matchScore?: number;
}

/**
 * Alignment configuration options
 */
export interface AlignmentConfig {
  fuzzyThreshold: number; // 0.0 to 1.0, minimum similarity score
  maxWordGap: number; // Maximum pixel distance between words to consider them connected
  currencyChars: string[]; // Characters to normalize for currency
  ocrMistakes: Record<string, string>; // Common OCR character mistakes
  debugMode: boolean; // Enable detailed logging
}

/**
 * Default configuration for bounding box alignment
 */
const DEFAULT_CONFIG: AlignmentConfig = {
  fuzzyThreshold: 0.75,
  maxWordGap: 10,
  currencyChars: ['$', '€', '£', '¥', '₹'],
  ocrMistakes: {
    '0': 'O',
    'O': '0',
    '1': 'l',
    'l': '1',
    'I': '1',
    '5': 'S',
    'S': '5',
    '6': 'G',
    'G': '6',
    '8': 'B',
    'B': '8'
  },
  debugMode: false
};

/**
 * Calculate Levenshtein distance for fuzzy string matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i += 1) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0.0 to 1.0)
 */
function calculateSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  
  const distance = levenshteinDistance(a, b);
  return (maxLen - distance) / maxLen;
}

/**
 * Normalize text for better matching by handling OCR mistakes and currency symbols
 */
function normalizeText(text: string, config: AlignmentConfig): string {
  let normalized = text.trim().toLowerCase();
  
  // Handle currency symbols
  config.currencyChars.forEach(char => {
    normalized = normalized.replace(new RegExp(`\\${char}`, 'g'), '$');
  });
  
  // Handle common OCR mistakes
  Object.entries(config.ocrMistakes).forEach(([wrong, correct]) => {
    normalized = normalized.replace(new RegExp(wrong, 'gi'), correct);
  });
  
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized;
}

/**
 * Calculate combined bounding box for multiple OCR words
 * Handles cases where words might be on different lines or have gaps
 */
function calculateCombinedBoundingBox(words: OCRWord[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (words.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  if (words.length === 1) {
    return words[0].boundingBox;
  }
  
  // Sort words by reading order (top-to-bottom, left-to-right)
  const sortedWords = [...words].sort((a, b) => {
    const aBox = a.boundingBox;
    const bBox = b.boundingBox;
    
    // If words are on different lines (significant Y difference)
    if (Math.abs(aBox.y - bBox.y) > Math.max(aBox.height, bBox.height) * 0.5) {
      return aBox.y - bBox.y; // Sort by Y position
    }
    
    // Same line, sort by X position
    return aBox.x - bBox.x;
  });
  
  // Find the bounding rectangle that contains all words
  const boxes = sortedWords.map(word => word.boundingBox);
  const minX = Math.min(...boxes.map(box => box.x));
  const minY = Math.min(...boxes.map(box => box.y));
  const maxX = Math.max(...boxes.map(box => box.x + box.width));
  const maxY = Math.max(...boxes.map(box => box.y + box.height));
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Calculate confidence score from multiple OCR words with various strategies
 */
function calculateAverageConfidence(words: OCRWord[], strategy: 'average' | 'minimum' | 'weighted' = 'weighted'): number {
  if (words.length === 0) return 0;
  
  if (strategy === 'minimum') {
    // Conservative approach: use the lowest confidence
    return Math.min(...words.map(word => word.confidence));
  }
  
  if (strategy === 'weighted') {
    // Weight by text length - longer words get more weight
    let totalWeightedConfidence = 0;
    let totalWeight = 0;
    
    words.forEach(word => {
      const weight = Math.max(1, word.text.length); // Minimum weight of 1
      totalWeightedConfidence += word.confidence * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? totalWeightedConfidence / totalWeight : 0;
  }
  
  // Default: simple average
  const sum = words.reduce((acc, word) => acc + word.confidence, 0);
  return sum / words.length;
}

/**
 * Find sequential word matches that maintain order and proximity
 */
function findSequentialWordMatch(
  normalizedSource: string,
  ocrWords: OCRWord[],
  config: AlignmentConfig
): {
  matchedWords: OCRWord[];
  matchScore: number;
} {
  const sourceWords = normalizedSource.split(/\s+/);
  if (sourceWords.length <= 1) {
    return { matchedWords: [], matchScore: 0 };
  }
  
  const bestSequences: Array<{
    words: OCRWord[];
    score: number;
    startIndex: number;
  }> = [];
  
  // Try to find sequences starting from each OCR word
  for (let startIdx = 0; startIdx <= ocrWords.length - sourceWords.length; startIdx++) {
    const sequence: OCRWord[] = [];
    let totalScore = 0;
    let matched = 0;
    
    for (let i = 0; i < sourceWords.length && startIdx + i < ocrWords.length; i++) {
      const sourceWord = sourceWords[i];
      const ocrWord = ocrWords[startIdx + i];
      const normalizedOcrWord = normalizeText(ocrWord.text, config);
      const similarity = calculateSimilarity(sourceWord, normalizedOcrWord);
      
      if (similarity >= config.fuzzyThreshold) {
        sequence.push(ocrWord);
        totalScore += similarity;
        matched++;
      } else if (i === 0) {
        // If first word doesn't match, skip this starting position
        break;
      }
      // Allow gaps in the middle but penalize them
      else {
        totalScore += similarity * 0.5; // Penalty for non-matching middle words
      }
    }
    
    if (matched >= Math.ceil(sourceWords.length * 0.6)) { // At least 60% match
      bestSequences.push({
        words: sequence,
        score: totalScore / sourceWords.length,
        startIndex: startIdx
      });
    }
  }
  
  // Return the best sequence
  if (bestSequences.length > 0) {
    bestSequences.sort((a, b) => b.score - a.score);
    return {
      matchedWords: bestSequences[0].words,
      matchScore: bestSequences[0].score
    };
  }
  
  return { matchedWords: [], matchScore: 0 };
}

/**
 * Find the best matching OCR words for a given source text
 */
function findMatchingWords(
  sourceText: string,
  ocrWords: OCRWord[],
  config: AlignmentConfig
): {
  matchedWords: OCRWord[];
  matchType: 'exact' | 'fuzzy' | 'partial' | 'none';
  matchScore: number;
} {
  const normalizedSource = normalizeText(sourceText, config);
  
  if (config.debugMode) {
    console.log(`[AlignBoundingBoxes] Looking for matches for: "${sourceText}" (normalized: "${normalizedSource}")`);
  }
  
  // Try exact match first
  const exactMatch = ocrWords.filter(word => 
    normalizeText(word.text, config) === normalizedSource
  );
  
  if (exactMatch.length > 0) {
    if (config.debugMode) {
      console.log(`[AlignBoundingBoxes] Found exact match: ${exactMatch.length} words`);
    }
    return {
      matchedWords: exactMatch,
      matchType: 'exact',
      matchScore: 1.0
    };
  }
  
  // Try fuzzy matching on individual words
  const fuzzyMatches: Array<{ word: OCRWord; score: number }> = [];
  
  ocrWords.forEach(word => {
    const normalizedWord = normalizeText(word.text, config);
    const similarity = calculateSimilarity(normalizedSource, normalizedWord);
    
    if (similarity >= config.fuzzyThreshold) {
      fuzzyMatches.push({ word, score: similarity });
    }
  });
  
  if (fuzzyMatches.length > 0) {
    // Sort by similarity score (highest first)
    fuzzyMatches.sort((a, b) => b.score - a.score);
    const bestMatch = fuzzyMatches[0];
    
    if (config.debugMode) {
      console.log(`[AlignBoundingBoxes] Found fuzzy match: "${bestMatch.word.text}" (score: ${bestMatch.score.toFixed(3)})`);
    }
    
    return {
      matchedWords: [bestMatch.word],
      matchType: 'fuzzy',
      matchScore: bestMatch.score
    };
  }
  
  // Try multi-word sequence matching first (maintains word order)
  const multiWordMatch = findSequentialWordMatch(normalizedSource, ocrWords, config);
  if (multiWordMatch.matchedWords.length > 0) {
    if (config.debugMode) {
      console.log(`[AlignBoundingBoxes] Found sequential match: ${multiWordMatch.matchedWords.length} words (score: ${multiWordMatch.matchScore.toFixed(3)})`);
    }
    
    return {
      matchedWords: multiWordMatch.matchedWords,
      matchType: 'partial',
      matchScore: multiWordMatch.matchScore
    };
  }
  
  // Try partial matching (source text spans multiple OCR words - any order)
  const sourceWords = normalizedSource.split(/\s+/);
  const partialMatches: OCRWord[] = [];
  const usedIndices = new Set<number>();
  let totalScore = 0;
  let matchedWordsCount = 0;
  
  for (const sourceWord of sourceWords) {
    let bestMatchScore = 0;
    let bestMatchIndex = -1;
    let bestMatchWord: OCRWord | null = null;
    
    ocrWords.forEach((ocrWord, index) => {
      if (usedIndices.has(index)) return; // Don't reuse OCR words
      
      const normalizedOcrWord = normalizeText(ocrWord.text, config);
      const similarity = calculateSimilarity(sourceWord, normalizedOcrWord);
      
      if (similarity >= config.fuzzyThreshold && similarity > bestMatchScore) {
        bestMatchScore = similarity;
        bestMatchIndex = index;
        bestMatchWord = ocrWord;
      }
    });
    
    if (bestMatchWord && bestMatchIndex >= 0) {
      partialMatches.push(bestMatchWord);
      usedIndices.add(bestMatchIndex);
      totalScore += bestMatchScore;
      matchedWordsCount++;
    }
  }
  
  if (partialMatches.length > 0) {
    const avgScore = totalScore / matchedWordsCount;
    
    if (config.debugMode) {
      console.log(`[AlignBoundingBoxes] Found partial match: ${partialMatches.length} words (avg score: ${avgScore.toFixed(3)})`);
    }
    
    return {
      matchedWords: partialMatches,
      matchType: 'partial',
      matchScore: avgScore
    };
  }
  
  if (config.debugMode) {
    console.log(`[AlignBoundingBoxes] No match found for: "${sourceText}"`);
  }
  
  return {
    matchedWords: [],
    matchType: 'none',
    matchScore: 0
  };
}

/**
 * Align Claude extraction fields with Google Vision OCR bounding boxes
 */
export function alignBoundingBoxes(
  extractedFields: Array<{
    name: string;
    value: string | number;
    sourceText: string;
    confidence: number;
  }>,
  ocrWords: OCRWord[],
  config: Partial<AlignmentConfig> = {}
): AlignedField[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (finalConfig.debugMode) {
    console.log(`[AlignBoundingBoxes] Starting alignment with ${extractedFields.length} fields and ${ocrWords.length} OCR words`);
  }
  
  const alignedFields: AlignedField[] = [];
  
  for (const field of extractedFields) {
    const matchResult = findMatchingWords(field.sourceText, ocrWords, finalConfig);
    
    let finalConfidence = field.confidence;
    
    // Apply confidence adjustments based on match quality
    if (matchResult.matchType === 'exact') {
      // Boost confidence for exact matches
      finalConfidence = Math.min(1.0, finalConfidence + 0.1);
    } else if (matchResult.matchType === 'fuzzy') {
      // Slight penalty for fuzzy matches
      finalConfidence = finalConfidence * 0.95 * matchResult.matchScore;
    } else if (matchResult.matchType === 'partial') {
      // Moderate penalty for partial matches
      finalConfidence = finalConfidence * 0.85 * matchResult.matchScore;
    } else {
      // Significant penalty for no matches
      finalConfidence = finalConfidence * 0.7;
    }
    
    // Calculate combined bounding box and OCR confidence if we have matches
    let boundingBox: AlignedField['boundingBox'];
    let ocrConfidence = 1.0;
    
    if (matchResult.matchedWords.length > 0) {
      boundingBox = calculateCombinedBoundingBox(matchResult.matchedWords);
      
      // Use different confidence strategies based on match type
      if (matchResult.matchType === 'exact') {
        ocrConfidence = calculateAverageConfidence(matchResult.matchedWords, 'average');
      } else if (matchResult.matchType === 'partial') {
        ocrConfidence = calculateAverageConfidence(matchResult.matchedWords, 'minimum');
      } else {
        ocrConfidence = calculateAverageConfidence(matchResult.matchedWords, 'weighted');
      }
      
      // Advanced confidence blending based on match quality
      const matchWeight = matchResult.matchScore || 1.0;
      const claudeWeight = 0.6; // Favor Claude slightly for semantic understanding
      const ocrWeight = 0.4; // OCR provides spatial validation
      
      finalConfidence = (finalConfidence * claudeWeight + ocrConfidence * ocrWeight * matchWeight);
      
      // Additional boost for high-quality exact matches
      if (matchResult.matchType === 'exact' && ocrConfidence > 0.9) {
        finalConfidence = Math.min(1.0, finalConfidence * 1.1);
      }
      
      // Penalty for scattered words (if bounding box is very wide relative to text)
      if (matchResult.matchedWords.length > 1 && boundingBox) {
        const avgWordWidth = matchResult.matchedWords.reduce((sum, word) => sum + word.boundingBox.width, 0) / matchResult.matchedWords.length;
        const boundingBoxWidth = boundingBox.width;
        
        if (boundingBoxWidth > avgWordWidth * matchResult.matchedWords.length * 2) {
          finalConfidence *= 0.9; // Small penalty for very scattered text
        }
      }
    }
    
    const alignedField: AlignedField = {
      name: field.name,
      value: field.value,
      sourceText: field.sourceText,
      boundingBox,
      ocrWords: matchResult.matchedWords,
      confidence: Math.max(0, Math.min(1, finalConfidence)),
      matchType: matchResult.matchType,
      matchScore: matchResult.matchScore
    };
    
    alignedFields.push(alignedField);
    
    if (finalConfig.debugMode) {
      console.log(`[AlignBoundingBoxes] Aligned field "${field.name}": ${matchResult.matchType} match, final confidence: ${finalConfidence.toFixed(3)}`);
    }
  }
  
  if (finalConfig.debugMode) {
    console.log(`[AlignBoundingBoxes] Completed alignment of ${alignedFields.length} fields`);
  }
  
  return alignedFields;
}

/**
 * Helper function to validate alignment results
 */
export function validateAlignment(alignedFields: AlignedField[]): {
  totalFields: number;
  exactMatches: number;
  fuzzyMatches: number;
  partialMatches: number;
  noMatches: number;
  averageConfidence: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  let totalConfidence = 0;
  const matchTypeCounts = {
    exact: 0,
    fuzzy: 0,
    partial: 0,
    none: 0
  };
  
  alignedFields.forEach(field => {
    matchTypeCounts[field.matchType]++;
    totalConfidence += field.confidence;
    
    if (field.matchType === 'none') {
      warnings.push(`No OCR match found for field "${field.name}" with source text: "${field.sourceText}"`);
    }
    
    if (field.confidence < 0.5) {
      warnings.push(`Low confidence (${(field.confidence * 100).toFixed(1)}%) for field "${field.name}"`);
    }
  });
  
  return {
    totalFields: alignedFields.length,
    exactMatches: matchTypeCounts.exact,
    fuzzyMatches: matchTypeCounts.fuzzy,
    partialMatches: matchTypeCounts.partial,
    noMatches: matchTypeCounts.none,
    averageConfidence: alignedFields.length > 0 ? totalConfidence / alignedFields.length : 0,
    warnings
  };
}