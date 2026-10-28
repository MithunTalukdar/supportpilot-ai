import { Request, Response } from 'express';
import { chatService } from './chat.service.js';
import { HttpStatus } from '../../constants/http-status.js';

export class ChatController {
  public async create(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };

    const conversation = await chatService.createConversation(orgId, actorUser, req.body);

    res.status(HttpStatus.CREATED).json({
      success: true,
      data: conversation,
      message: 'Support conversation created successfully',
    });
  }

  public async list(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };
    const query = {
      ticketId: req.query.ticketId as string | undefined,
      customerId: req.query.customerId as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    };

    const result = await chatService.listConversations(orgId, actorUser, query);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  }

  public async get(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const conversationId = req.params.conversationId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };

    const conversation = await chatService.getConversation(orgId, conversationId, actorUser);

    res.status(HttpStatus.OK).json({
      success: true,
      data: conversation,
    });
  }

  public async sendMessage(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const conversationId = req.params.conversationId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };
    const content = req.body?.content;

    const result = await chatService.sendMessage(orgId, conversationId, actorUser, content);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
      message: 'Message processed and answered',
    });
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const conversationId = req.params.conversationId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };

    const result = await chatService.deleteConversation(orgId, conversationId, actorUser);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
      message: 'Conversation deleted successfully',
    });
  }
}

export const chatController = new ChatController();
