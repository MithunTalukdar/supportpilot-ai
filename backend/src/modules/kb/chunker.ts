export interface ChunkOptions {
  targetChunkTokens?: number; // Default 500 (~1750 chars)
  overlapTokens?: number;     // Default 50 (~175 chars)
}

export interface DocumentChunkDraft {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadata: {
    chunkIndex: number;
    startChar: number;
    endChar: number;
    charLength: number;
  };
}

export class SemanticChunker {
  private static readonly CHARS_PER_TOKEN = 3.5;

  /**
   * Splits normalized document text into semantically cohesive overlapping chunks.
   * Prioritizes paragraph boundaries, sentence breaks, and line breaks before word splitting.
   */
  public static split(text: string, options: ChunkOptions = {}): DocumentChunkDraft[] {
    const targetTokens = options.targetChunkTokens || 500;
    const overlapTokens = options.overlapTokens || 50;

    const targetChars = Math.round(targetTokens * this.CHARS_PER_TOKEN);
    const overlapChars = Math.round(overlapTokens * this.CHARS_PER_TOKEN);

    const cleanText = text.trim();
    if (!cleanText) return [];

    // If text is smaller than target chunk size, return single chunk
    if (cleanText.length <= targetChars) {
      const tokenCount = this.estimateTokens(cleanText);
      return [
        {
          chunkIndex: 0,
          content: cleanText,
          tokenCount,
          metadata: {
            chunkIndex: 0,
            startChar: 0,
            endChar: cleanText.length,
            charLength: cleanText.length,
          },
        },
      ];
    }

    const chunks: DocumentChunkDraft[] = [];
    let startChar = 0;
    let chunkIndex = 0;

    while (startChar < cleanText.length) {
      let endChar = Math.min(startChar + targetChars, cleanText.length);

      // If we are not at the end of the text, seek a natural boundary
      if (endChar < cleanText.length) {
        const naturalBreak = this.findNaturalBreak(cleanText, startChar, endChar);
        if (naturalBreak > startChar + Math.round(targetChars * 0.4)) {
          endChar = naturalBreak;
        }
      }

      const rawChunk = cleanText.substring(startChar, endChar).trim();
      if (rawChunk.length > 0) {
        chunks.push({
          chunkIndex,
          content: rawChunk,
          tokenCount: this.estimateTokens(rawChunk),
          metadata: {
            chunkIndex,
            startChar,
            endChar,
            charLength: rawChunk.length,
          },
        });
        chunkIndex++;
      }

      // If we reached the end of the document, stop
      if (endChar >= cleanText.length) {
        break;
      }

      // Advance startChar with overlap
      const nextStart = endChar - overlapChars;
      // Guard against infinite loop
      startChar = nextStart > startChar ? nextStart : endChar;
    }

    return chunks;
  }

  /**
   * Finds the best natural break point (paragraph, newline, sentence, or word)
   * within the lookback window near endChar.
   */
  private static findNaturalBreak(text: string, start: number, end: number): number {
    const lookbackDistance = Math.min(Math.round((end - start) * 0.25), 300);
    const windowStart = Math.max(start, end - lookbackDistance);
    const window = text.substring(windowStart, end);

    // 1. Look for paragraph break (\n\n)
    const paraIdx = window.lastIndexOf('\n\n');
    if (paraIdx !== -1) {
      return windowStart + paraIdx + 2;
    }

    // 2. Look for sentence break (". ", "? ", "! ")
    const sentenceMatches = [...window.matchAll(/[.?!]\s+/g)];
    if (sentenceMatches.length > 0) {
      const lastSentence = sentenceMatches[sentenceMatches.length - 1];
      if (lastSentence.index !== undefined) {
        return windowStart + lastSentence.index + lastSentence[0].length;
      }
    }

    // 3. Look for newline (\n)
    const lineIdx = window.lastIndexOf('\n');
    if (lineIdx !== -1) {
      return windowStart + lineIdx + 1;
    }

    // 4. Look for whitespace
    const spaceIdx = window.lastIndexOf(' ');
    if (spaceIdx !== -1) {
      return windowStart + spaceIdx + 1;
    }

    // Fallback: strict cut
    return end;
  }

  public static estimateTokens(text: string): number {
    return Math.max(1, Math.ceil(text.length / this.CHARS_PER_TOKEN));
  }
}
