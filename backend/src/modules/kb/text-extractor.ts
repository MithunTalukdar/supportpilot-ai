import * as pdfModule from 'pdf-parse';
import { AppError, BadRequestError } from '../../errors/app-error.js';
import { logger } from '../../logging/logger.js';

export interface ExtractedDocument {
  text: string;
  pageCount: number;
  wordCount: number;
  characterCount: number;
  metadata: Record<string, unknown>;
}

export class TextExtractor {
  public static async extract(
    buffer: Buffer,
    extension: string
  ): Promise<ExtractedDocument> {
    if (extension === '.pdf') {
      return this.extractFromPdf(buffer);
    } else {
      return this.extractFromPlainText(buffer);
    }
  }

  private static async extractFromPdf(buffer: Buffer): Promise<ExtractedDocument> {
    try {
      const parsed = await this.parsePdfBuffer(buffer);
      const normalized = this.normalizeText(parsed.text);

      if (!normalized || normalized.trim().length < 5) {
        throw new BadRequestError(
          'PDF contains no readable text (it may be scanned images without OCR or an empty document)'
        );
      }

      const words = normalized.split(/\s+/).filter((w) => w.length > 0);

      return {
        text: normalized,
        pageCount: parsed.numpages || 1,
        wordCount: words.length,
        characterCount: normalized.length,
        metadata: {
          pageCount: parsed.numpages || 1,
        },
      };
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }
      logger.error({ err }, 'PDF parsing failed on uploaded buffer');
      throw new BadRequestError(
        `Failed to parse PDF document: ${(err as Error).message || 'Corrupt or unreadable PDF structure'}`
      );
    }
  }

  private static async parsePdfBuffer(
    buffer: Buffer
  ): Promise<{ text: string; numpages: number }> {
    // 1. Check for modern PDFParse class export
    const PDFParseClass = (
      pdfModule as unknown as {
        PDFParse?: new (opts: { data: Buffer }) => {
          load: () => Promise<void>;
          getText: () => Promise<{ text: string; total?: number }>;
          destroy: () => Promise<void>;
        };
      }
    ).PDFParse;

    if (PDFParseClass) {
      const parser = new PDFParseClass({ data: buffer });
      try {
        await parser.load();
        const res = await parser.getText();
        return {
          text: res.text || '',
          numpages: res.total || 1,
        };
      } finally {
        await parser.destroy().catch(() => {});
      }
    }

    // 2. Fallback to default function if present
    const defaultFn =
      (
        pdfModule as unknown as {
          default?: (buf: Buffer) => Promise<{ text: string; numpages: number }>;
        }
      ).default ||
      (pdfModule as unknown as (buf: Buffer) => Promise<{ text: string; numpages: number }>);

    if (typeof defaultFn === 'function') {
      const res = await defaultFn(buffer);
      return {
        text: res.text || '',
        numpages: res.numpages || 1,
      };
    }

    throw new Error('PDF parsing engine unavailable');
  }

  private static extractFromPlainText(buffer: Buffer): ExtractedDocument {
    try {
      const rawText = buffer.toString('utf-8');
      const normalized = this.normalizeText(rawText);

      if (!normalized || normalized.trim().length < 5) {
        throw new BadRequestError('Document contains no readable text content');
      }

      const words = normalized.split(/\s+/).filter((w) => w.length > 0);

      return {
        text: normalized,
        pageCount: 1,
        wordCount: words.length,
        characterCount: normalized.length,
        metadata: {},
      };
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new BadRequestError(
        `Failed to read text document: ${(err as Error).message || 'Invalid text encoding'}`
      );
    }
  }

  private static normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, '  ')
      .replace(/[ \f\v]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
