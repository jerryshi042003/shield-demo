import { redirect } from 'next/navigation';
import { defaultSalesGamePath } from '@/lib/routes';

export default function SalesGameDefaultPage() {
  redirect(defaultSalesGamePath());
}
