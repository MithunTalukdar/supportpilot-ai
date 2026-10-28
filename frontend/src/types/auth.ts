export type OrgRole = 'OWNER' | 'AGENT' | 'CUSTOMER';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface UserMembership {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: OrgRole;
}

export interface OrgMemberDetail {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  role: OrgRole;
  joinedAt: string;
}
