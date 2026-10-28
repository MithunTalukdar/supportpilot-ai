import { Request, Response } from 'express';
import { orgService } from './org.service.js';
import { HttpStatus } from '../../constants/http-status.js';

export class OrgController {
  public async create(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const result = await orgService.createOrganization(userId, req.body);

    res.status(HttpStatus.CREATED).json({
      success: true,
      data: result,
    });
  }

  public async get(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const result = await orgService.getOrganization(orgId);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  }

  public async listMembers(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const members = await orgService.listMembers(orgId);

    res.status(HttpStatus.OK).json({
      success: true,
      data: members,
    });
  }

  public async addMember(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const actorId = req.user!.id;
    const result = await orgService.addMember(orgId, actorId, req.body);

    res.status(HttpStatus.CREATED).json({
      success: true,
      data: result,
    });
  }

  public async updateRole(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const actorId = req.user!.id;
    const targetUserId = req.params.userId;
    const result = await orgService.updateMemberRole(orgId, actorId, targetUserId, req.body.role);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  }

  public async removeMember(req: Request, res: Response): Promise<void> {
    const orgId = req.tenant!.organizationId;
    const actorId = req.user!.id;
    const targetUserId = req.params.userId;
    const result = await orgService.removeMember(orgId, actorId, targetUserId);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  }
}

export const orgController = new OrgController();
