import { redirect } from 'next/navigation';
import { defaultSalesSeasonPath } from '@/lib/routes';

export default function SalesPage() {
  redirect(defaultSalesSeasonPath());
}
