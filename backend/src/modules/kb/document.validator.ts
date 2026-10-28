import path from 'path';
import { BadRequestError } from '../../errors/app-error.js';

export const MAX_DOCUMENT_BYTE_SIZE = 15 * 1024 * 1024; // 15MB
export const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md'];
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/octet-stream',
];

export interface ValidatedFile {
  originalName: string;
  extension: string;
  mimeType: string;
  buffer: Buffer;
  byteSize: number;
}

export class DocumentValidator {
  public static validate(file: Express.Multer.File | undefined): ValidatedFile {
    if (!file) {
      throw new BadRequestError('No file provided in the upload request');
    }

    const byteSize = file.size ?? file.buffer?.length ?? 0;

    // Check Empty File
    if (byteSize === 0) {
      throw new BadRequestError('Uploaded file is empty (0 bytes)');
    }

    // Check Max Size
    if (byteSize > MAX_DOCUMENT_BYTE_SIZE) {
      throw new BadRequestError(
        `Uploaded document exceeds maximum allowed size of 15MB (received ${(byteSize / (1024 * 1024)).toFixed(2)}MB)`
      );
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestError(
        `Unsupported file extension '${ext}'. Allowed types are: ${ALLOWED_EXTENSIONS.join(', ')}`
      );
    }

    // Check MIME type
    if (file.mimetype && !ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      throw new BadRequestError(
        `Invalid MIME type '${file.mimetype}'. Only PDF and plain text documents are permitted`
      );
    }

    const buffer = file.buffer;
    if (!buffer || buffer.length === 0) {
      throw new BadRequestError('Uploaded document buffer is empty');
    }

    // Magic number verification
    if (ext === '.pdf') {
      // PDF files must start with '%PDF-' (0x25, 0x50, 0x44, 0x46, 0x2D)
      const pdfHeader = buffer.subarray(0, 5).toString('ascii');
      if (!pdfHeader.startsWith('%PDF-')) {
        throw new BadRequestError('File signature does not match a valid PDF document (missing %PDF- header)');
      }
    } else {
      // For TXT and MD, ensure no binary/executable signatures (e.g. MZ, ELF, or excessive null bytes)
      const isElf = buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46;
      const isDos = buffer[0] === 0x4d && buffer[1] === 0x5a;
      if (isElf || isDos) {
        throw new BadRequestError('Binary or executable file signatures are forbidden in text documents');
      }

      // Check for null bytes in initial sample
      const sample = buffer.subarray(0, Math.min(buffer.length, 1024));
      let nullCount = 0;
      for (let i = 0; i < sample.length; i++) {
        if (sample[i] === 0) nullCount++;
      }
      if (nullCount > 2) {
        throw new BadRequestError('Uploaded text document appears to contain binary content');
      }
    }

    return {
      originalName: file.originalname,
      extension: ext,
      mimeType: file.mimetype || (ext === '.pdf' ? 'application/pdf' : 'text/plain'),
      buffer,
      byteSize,
    };
  }
}
