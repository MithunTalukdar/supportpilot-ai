import { Request, Response } from 'express';
import { ticketService } from './ticket.service.js';
import { commentService } from './comment.service.js';
import { HttpStatus } from '../../constants/http-status.js';

export class TicketController {
  public async create(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };
    const ticket = await ticketService.createTicket(orgId, actorUser, req.body);

    res.status(HttpStatus.CREATED).json({
      success: true,
      data: ticket,
    });
  }

  public async list(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };
    const result = await ticketService.listTickets(orgId, actorUser, req.query as unknown as Parameters<typeof ticketService.listTickets>[2]);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result.tickets,
      meta: result.meta,
    });
  }

  public async get(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const ticketId = req.params.ticketId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };
    const ticket = await ticketService.getTicketById(orgId, ticketId, actorUser);

    res.status(HttpStatus.OK).json({
      success: true,
      data: ticket,
    });
  }

  public async update(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const ticketId = req.params.ticketId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };
    const updated = await ticketService.updateTicket(orgId, ticketId, actorUser, req.body);

    res.status(HttpStatus.OK).json({
      success: true,
      data: updated,
    });
  }

  public async getMetrics(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const metrics = await ticketService.getMetrics(orgId);

    res.status(HttpStatus.OK).json({
      success: true,
      data: metrics,
    });
  }

  public async addComment(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const ticketId = req.params.ticketId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };
    const comment = await commentService.addComment(orgId, ticketId, actorUser, req.body);

    res.status(HttpStatus.CREATED).json({
      success: true,
      data: comment,
    });
  }

  public async listComments(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const ticketId = req.params.ticketId;
    const actorUser = { id: req.user!.id, role: req.tenant!.role };
    const comments = await commentService.listComments(orgId, ticketId, actorUser);

    res.status(HttpStatus.OK).json({
      success: true,
      data: comments,
    });
  }
}

export const ticketController = new TicketController();
