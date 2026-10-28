import { prisma } from '../../repositories/prisma.js';
import { OrgRole } from '@prisma/client';
import { ConflictError, NotFoundError, BadRequestError } from '../../errors/app-error.js';
import { logger } from '../../logging/logger.js';
import { devFallbackStore, isDbUnavailableError } from '../../repositories/dev-fallback.store.js';

export interface CreateOrgDto {
  name: string;
  slug: string;
  domain?: string;
}

export interface AddMemberDto {
  email: string;
  role: OrgRole;
}

export class OrgService {
  public async createOrganization(creatorUserId: string, dto: CreateOrgDto) {
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });

    if (existingOrg) {
      throw new ConflictError(`Organization with slug '${dto.slug}' already exists`);
    }

    // Atomically create organization and assign creator as OWNER
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          domain: dto.domain,
        },
      });

      const membership = await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: creatorUserId,
          role: OrgRole.OWNER,
        },
      });

      return { org, membership };
    });

    logger.info(
      { orgId: result.org.id, creatorId: creatorUserId },
      'Organization created and Owner membership initialized'
    );

    return {
      id: result.org.id,
      name: result.org.name,
      slug: result.org.slug,
      domain: result.org.domain,
      role: result.membership.role,
      createdAt: result.org.createdAt,
    };
  }

  public async getOrganization(orgId: string) {
    let org;
    try {
      org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production' && isDbUnavailableError(err)) {
        return devFallbackStore.defaultOrg;
      }
      throw err;
    }

    if (!org) {
      if (process.env.NODE_ENV !== 'production') {
        return devFallbackStore.defaultOrg;
      }
      throw new NotFoundError('Organization not found');
    }

    return org;
  }

  public async listMembers(orgId: string) {
    let members;
    try {
      members = await prisma.organizationMember.findMany({
        where: { organizationId: orgId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production' && isDbUnavailableError(err)) {
        return [
          {
            id: 'm1',
            userId: '10000000-0000-4000-8000-000000000001',
            fullName: 'Alice Owner',
            email: 'owner@alpha.com',
            role: OrgRole.OWNER,
            joinedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
          {
            id: 'm2',
            userId: '10000000-0000-4000-8000-000000000002',
            fullName: 'Bob Agent',
            email: 'agent@alpha.com',
            role: OrgRole.AGENT,
            joinedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
          {
            id: 'm3',
            userId: '10000000-0000-4000-8000-000000000003',
            fullName: 'Charlie Customer',
            email: 'customer@alpha.com',
            role: OrgRole.CUSTOMER,
            joinedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        ];
      }
      throw err;
    }

    return members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      fullName: m.user.fullName,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  public async addMember(orgId: string, _actorUserId: string, dto: AddMemberDto) {
    const targetUser = await prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      throw new NotFoundError(`No user found with email '${dto.email}'. User must register first.`);
    }

    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError('User is already a member of this organization');
    }

    const newMember = await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: targetUser.id,
        role: dto.role,
      },
    });

    logger.info(
      { orgId, targetUserId: targetUser.id, role: dto.role },
      'Member added to organization'
    );

    return {
      message: 'Member successfully added to organization',
      memberId: newMember.id,
      userId: targetUser.id,
      role: newMember.role,
    };
  }

  public async updateMemberRole(
    orgId: string,
    actorUserId: string,
    targetUserId: string,
    newRole: OrgRole
  ) {
    const targetMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership) {
      throw new NotFoundError('Member not found in this organization');
    }

    // Safety check: Prevent the last Owner from demoting themselves
    if (targetUserId === actorUserId && newRole !== OrgRole.OWNER) {
      const ownerCount = await prisma.organizationMember.count({
        where: {
          organizationId: orgId,
          role: OrgRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestError('Cannot demote yourself: You are the sole Owner of this organization.');
      }
    }

    const updated = await prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: targetUserId,
        },
      },
      data: { role: newRole },
    });

    return {
      message: 'Member role updated successfully',
      memberId: updated.id,
      userId: updated.userId,
      role: updated.role,
    };
  }

  public async removeMember(orgId: string, _actorUserId: string, targetUserId: string) {
    const targetMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership) {
      throw new NotFoundError('Member not found in this organization');
    }

    // Safety check: Prevent removing the sole Owner
    if (targetMembership.role === OrgRole.OWNER) {
      const ownerCount = await prisma.organizationMember.count({
        where: {
          organizationId: orgId,
          role: OrgRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestError('Cannot remove the sole Owner of this organization.');
      }
    }

    await prisma.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: targetUserId,
        },
      },
    });

    return {
      message: 'Member removed from organization successfully',
    };
  }
}

export const orgService = new OrgService();
