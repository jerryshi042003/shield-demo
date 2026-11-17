import type { Franchise } from '@/lib/franchise';

export interface AuthUser {
  firstName: string;
  fullName: string;
  email: string;
  isSuperAdmin?: boolean;
  allowedFranchises?: Franchise[];
}
