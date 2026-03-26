/**
 * A robust JSON parser that handles common LLM formatting issues
 * like trailing commas, missing brackets, markdown wrapping, or
 * JSON embedded within explanatory text.
 */
export function safeJsonParse<T>(rawText: string, fallback: T): T {
  if (!rawText) return fallback;
  
  try {
    // 1. Strip markdown code blocks
    let cleaned = rawText.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    
    // 2. Try standard parse first
    return JSON.parse(cleaned) as T;
  } catch {
    try {
      // 3. Try to extract JSON object or array from within text
      // Look for the first { or [ and the last } or ]
      const firstBrace = rawText.indexOf('{');
      const firstBracket = rawText.indexOf('[');
      let start = -1;
      let end = -1;
      
      if (firstBrace >= 0 && (firstBracket < 0 || firstBrace < firstBracket)) {
        start = firstBrace;
        end = rawText.lastIndexOf('}');
      } else if (firstBracket >= 0) {
        start = firstBracket;
        end = rawText.lastIndexOf(']');
      }

      if (start >= 0 && end > start) {
        const extracted = rawText.substring(start, end + 1);
        return JSON.parse(extracted) as T;
      }
    } catch {
      // continue to next attempt
    }

    try {
      // 4. Aggressive cleanup: remove trailing commas, strip markdown
      const aggressiveClean = rawText
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/gi, '')
        .replace(/,\s*([\]}])/g, '$1')
        .trim();
        
      const firstBrace2 = aggressiveClean.indexOf('{');
      const firstBracket2 = aggressiveClean.indexOf('[');
      let start2 = -1;
      let end2 = -1;
      
      if (firstBrace2 >= 0 && (firstBracket2 < 0 || firstBrace2 < firstBracket2)) {
        start2 = firstBrace2;
        end2 = aggressiveClean.lastIndexOf('}');
      } else if (firstBracket2 >= 0) {
        start2 = firstBracket2;
        end2 = aggressiveClean.lastIndexOf(']');
      }

      if (start2 >= 0 && end2 > start2) {
        return JSON.parse(aggressiveClean.substring(start2, end2 + 1)) as T;
      }

      return JSON.parse(aggressiveClean) as T;
    } catch (finalError) {
      console.warn("safeJsonParse failed entirely. Returning fallback.");
      return fallback;
    }
  }
}
