import { getAllowedFranchisesForViewer } from '@/lib/auth/superadmin';
import { SelectFranchiseClient } from './select-franchise-client';

export const dynamic = 'force-dynamic';

export default async function SelectFranchisePage() {
  return <SelectFranchiseClient allowedFranchises={getAllowedFranchisesForViewer()} />;
}
