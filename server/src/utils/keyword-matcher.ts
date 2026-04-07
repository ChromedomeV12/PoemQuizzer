/**
 * Short Answer Keyword Matcher
 *
 * Performs case-insensitive partial matching against a list of acceptable keywords.
 * Match ANY keyword = Correct.
 *
 * Examples:
 *   keywords: ["photosynthesis", "chlorophyll", "sunlight"]
 *   answer: "The process uses sunlight" -> MATCHES "sunlight" -> CORRECT
 *
 *   keywords: ["mitochondria", "powerhouse"]
 *   answer: "The cell nucleus" -> NO MATCH -> INCORRECT
 */

interface MatchResult {
  isCorrect: boolean;
  matchedKeyword: string | null;
  confidence: number; // 0-1 based on how much of the keyword matched
}

/**
 * Check if the user's answer matches any of the acceptable keywords.
 * Uses case-insensitive partial matching.
 */
export function matchKeywords(
  userAnswer: string,
  keywords: string[]
): MatchResult {
  if (!keywords.length) {
    return { isCorrect: false, matchedKeyword: null, confidence: 0 };
  }

  const normalizedAnswer = userAnswer.toLowerCase().trim();

  if (!normalizedAnswer) {
    return { isCorrect: false, matchedKeyword: null, confidence: 0 };
  }

  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase().trim();

    if (!normalizedKeyword) continue;

    // Direct inclusion check (keyword appears in answer)
    if (normalizedAnswer.includes(normalizedKeyword)) {
      return {
        isCorrect: true,
        matchedKeyword: keyword,
        confidence: normalizedKeyword.length / normalizedAnswer.length,
      };
    }

    // Reverse check: answer appears within keyword (for very short answers)
    if (normalizedKeyword.includes(normalizedAnswer) && normalizedAnswer.length >= 3) {
      return {
        isCorrect: true,
        matchedKeyword: keyword,
        confidence: normalizedAnswer.length / normalizedKeyword.length,
      };
    }

    // Levenshtein distance for typos (only for short keywords)
    if (normalizedKeyword.length <= 15) {
      const distance = levenshteinDistance(normalizedAnswer, normalizedKeyword);
      const maxLen = Math.max(normalizedAnswer.length, normalizedKeyword.length);
      const similarity = 1 - distance / maxLen;

      // 80% similarity threshold
      if (similarity >= 0.8) {
        return {
          isCorrect: true,
          matchedKeyword: keyword,
          confidence: similarity,
        };
      }
    }
  }

  return { isCorrect: false, matchedKeyword: null, confidence: 0 };
}

/**
 * Calculate the Levenshtein distance between two strings.
 * Used for fuzzy matching to handle minor typos.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Validate that keywords array is well-formed.
 */
export function validateKeywords(keywords: unknown): string[] {
  if (!Array.isArray(keywords)) {
    throw new Error('Keywords must be an array');
  }

  const valid = keywords.filter(
    (k): k is string => typeof k === 'string' && k.trim().length > 0
  );

  if (valid.length === 0) {
    throw new Error('At least one non-empty keyword is required');
  }

  return valid;
}
