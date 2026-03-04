// Crisis detection utility
// Scans text for keywords that may indicate someone needs immediate support

const CRISIS_PATTERNS = [
  // Suicide/self-harm
  /\b(suicide|suicidal)\b/i,
  /\b(kill|end|hurt)\s+(myself|my\s*self)\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(live|be\s+alive|exist)\b/i,
  /\bending\s+(it\s+all|my\s+life|everything)\b/i,
  /\bself[- ]?harm/i,
  /\bcutting\s+(myself|my\s*self)\b/i,
  /\btake\s+my\s+(own\s+)?life\b/i,
  /\bbetter\s+off\s+(dead|without\s+me)\b/i,
  /\bno\s+reason\s+to\s+live\b/i,

  // Violence toward others
  /\b(kill|murder|hurt|harm)\s+(him|her|them|my\s+(partner|husband|wife|spouse|boyfriend|girlfriend))\b/i,
  /\bgoing\s+to\s+(kill|hurt|harm)\b/i,

  // Abuse indicators
  /\b(he|she|they|partner)\s+(hits?|beats?|chokes?|strangles?)\s+me\b/i,
  /\bbeing\s+(abused|beaten|hit)\b/i,
  /\bphysical(ly)?\s+abuse/i,
  /\bdomestic\s+(violence|abuse)\b/i,
  /\bafraid\s+(he|she|they|partner).{0,20}(hurt|kill|hit)\b/i,
  /\bthreatened\s+to\s+(kill|hurt)\b/i,
];

/**
 * Check if text contains crisis indicators
 * @param {string} text - Text to analyze
 * @returns {{ detected: boolean, type: string | null }}
 */
export function detectCrisis(text) {
  if (!text || typeof text !== 'string') {
    return { detected: false, type: null };
  }

  const normalizedText = text.toLowerCase();

  // Check for suicide/self-harm patterns
  const selfHarmPatterns = CRISIS_PATTERNS.slice(0, 10);
  for (const pattern of selfHarmPatterns) {
    if (pattern.test(normalizedText)) {
      return { detected: true, type: 'self-harm' };
    }
  }

  // Check for violence patterns
  const violencePatterns = CRISIS_PATTERNS.slice(10, 12);
  for (const pattern of violencePatterns) {
    if (pattern.test(normalizedText)) {
      return { detected: true, type: 'violence' };
    }
  }

  // Check for abuse patterns
  const abusePatterns = CRISIS_PATTERNS.slice(12);
  for (const pattern of abusePatterns) {
    if (pattern.test(normalizedText)) {
      return { detected: true, type: 'abuse' };
    }
  }

  return { detected: false, type: null };
}

/**
 * Check multiple text fields for crisis indicators
 * @param {string[]} texts - Array of text strings to check
 * @returns {{ detected: boolean, type: string | null }}
 */
export function detectCrisisInMultiple(texts) {
  for (const text of texts) {
    const result = detectCrisis(text);
    if (result.detected) {
      return result;
    }
  }
  return { detected: false, type: null };
}
