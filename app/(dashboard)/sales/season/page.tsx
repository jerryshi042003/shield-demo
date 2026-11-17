import { redirect } from 'next/navigation';
import { defaultSalesSeasonPath } from '@/lib/routes';

export default function SalesSeasonDefaultPage() {
  redirect(defaultSalesSeasonPath());
}
