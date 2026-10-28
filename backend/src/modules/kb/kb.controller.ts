import { Request, Response } from 'express';
import { kbService } from './kb.service.js';
import { HttpStatus } from '../../constants/http-status.js';
import { DocumentStatus } from '@prisma/client';

export class KnowledgeBaseController {
  public async upload(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };
    const customTitle = req.body?.title;

    const result = await kbService.uploadAndProcessDocument(
      orgId,
      actorUser,
      req.file,
      customTitle
    );

    res.status(HttpStatus.CREATED).json({
      success: true,
      data: result,
      message: 'Document successfully ingested and indexed into pgvector',
    });
  }

  public async list(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const status = req.query.status as DocumentStatus | undefined;
    const search = req.query.search as string | undefined;

    const result = await kbService.listDocuments(orgId, { page, limit, status, search });

    res.status(HttpStatus.OK).json({
      success: true,
      data: result.documents,
      meta: result.meta,
    });
  }

  public async get(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const docId = req.params.docId;

    const document = await kbService.getDocumentById(orgId, docId);

    res.status(HttpStatus.OK).json({
      success: true,
      data: document,
    });
  }

  public async reprocess(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const docId = req.params.docId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };

    const result = await kbService.reprocessDocument(orgId, docId, actorUser);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
      message: 'Document successfully reprocessed and re-indexed',
    });
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const docId = req.params.docId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };

    const result = await kbService.deleteDocument(orgId, docId, actorUser);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  }

  public async search(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const queryText = req.body?.query || '';
    const limit = req.body?.limit ? parseInt(req.body.limit, 10) : 5;
    const threshold = req.body?.threshold !== undefined ? parseFloat(req.body.threshold) : 0.4;

    const results = await kbService.searchKnowledgeBase(orgId, queryText, { limit, threshold });

    res.status(HttpStatus.OK).json({
      success: true,
      data: results,
      meta: {
        totalMatches: results.length,
        query: queryText,
      },
    });
  }
}

export const kbController = new KnowledgeBaseController();
