import { Request, Response } from 'express';
import { aiAssistService } from './ai-assist.service.js';
import { HttpStatus } from '../../constants/http-status.js';

export class AIAssistController {
  public async summarizeTicket(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const ticketId = req.params.ticketId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };

    const result = await aiAssistService.summarizeTicket(orgId, ticketId, actorUser);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
      message: 'Ticket summarized successfully',
    });
  }

  public async classifyTicket(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const ticketId = req.params.ticketId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };

    const result = await aiAssistService.classifyTicket(orgId, ticketId, actorUser);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
      message: 'Ticket classified successfully',
    });
  }

  public async suggestReply(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const ticketId = req.params.ticketId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };

    const result = await aiAssistService.suggestReply(orgId, ticketId, actorUser);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
      message: 'Reply suggestion generated successfully',
    });
  }

  public async getUsageLedger(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const feature = req.query.feature as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    const result = await aiAssistService.getUsageLedger(orgId, { feature, page, limit });

    res.status(HttpStatus.OK).json({
      success: true,
      data: result.records,
      meta: result.meta,
      summary: result.summary,
    });
  }

  public async getSettings(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const settings = await aiAssistService.getSettings(orgId);

    res.status(HttpStatus.OK).json({
      success: true,
      data: settings,
    });
  }

  public async updateSettings(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const updates = req.body;

    const settings = await aiAssistService.updateSettings(orgId, updates);

    res.status(HttpStatus.OK).json({
      success: true,
      data: settings,
      message: 'AI settings updated successfully',
    });
  }
}

export const aiAssistController = new AIAssistController();
