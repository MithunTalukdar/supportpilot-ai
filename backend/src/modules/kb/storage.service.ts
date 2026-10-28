import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../../logging/logger.js';
import { NotFoundError, BadRequestError } from '../../errors/app-error.js';

export class DocumentStorageService {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || path.resolve(process.cwd(), 'storage', 'documents');
  }

  /**
   * Initializes the storage directory if it doesn't already exist.
   */
  public async init(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (err) {
      logger.error({ err }, 'Failed to initialize document storage directory');
    }
  }

  /**
   * Generates a collision-resistant safe storage key and writes file to disk.
   * Client-supplied filenames and paths are completely discarded.
   */
  public async saveFile(
    orgId: string,
    extension: string,
    buffer: Buffer
  ): Promise<{ fileKey: string; byteSize: number }> {
    await this.init();

    const sanitizedExt = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
    const uniqueId = crypto.randomUUID();
    const safeOrgId = orgId.replace(/[^a-zA-Z0-9-]/g, '');
    const fileKey = `${safeOrgId}/${uniqueId}${sanitizedExt}`;

    const orgFolder = path.join(this.baseDir, safeOrgId);
    await fs.mkdir(orgFolder, { recursive: true });

    const fullPath = this.resolveSafePath(fileKey);
    await fs.writeFile(fullPath, buffer);

    logger.debug({ fileKey }, 'Safely persisted document to disk storage');
    return { fileKey, byteSize: buffer.length };
  }

  /**
   * Reads a stored file by its generated fileKey.
   */
  public async readFile(fileKey: string): Promise<Buffer> {
    const fullPath = this.resolveSafePath(fileKey);
    try {
      return await fs.readFile(fullPath);
    } catch (err) {
      logger.error({ err, fileKey }, 'Failed to read document from storage');
      throw new NotFoundError('Underlying document file could not be found on storage');
    }
  }

  /**
   * Deletes a stored file from disk.
   */
  public async deleteFile(fileKey: string): Promise<void> {
    try {
      const fullPath = this.resolveSafePath(fileKey);
      await fs.unlink(fullPath);
      logger.debug({ fileKey }, 'Deleted document file from disk storage');
    } catch {
      // Non-blocking if file already removed
    }
  }

  /**
   * Ensures the fileKey does not escape baseDir via directory traversal.
   */
  private resolveSafePath(fileKey: string): string {
    const safeKey = path.normalize(fileKey).replace(/^(\.\.(\/|\\|$))+/, '');
    const resolved = path.resolve(this.baseDir, safeKey);

    if (!resolved.startsWith(this.baseDir)) {
      throw new BadRequestError('Path traversal attack detected in storage key');
    }

    return resolved;
  }
}

export const documentStorage = new DocumentStorageService();
