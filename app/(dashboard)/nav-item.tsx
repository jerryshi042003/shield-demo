'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavItem({
  href,
  children
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center px-3 py-2 rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-accent',
        {
          'bg-accent text-foreground': pathname === href
        }
      )}
    >
      {children}
    </Link>
  );
}
