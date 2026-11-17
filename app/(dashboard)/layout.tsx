import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import {
  Home,
  LineChart,
  PanelLeft,
  Settings
} from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { User } from './user';
import Providers from './providers';
import { SearchInput } from './search';
import { COLORS } from '@/lib/design-tokens';
import { DashboardContent } from './dashboard-content';
import { ShieldAnimation } from '@/components/ui/ShieldAnimation';
import type { AuthUser } from '@/lib/types/auth-user';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';
import { getFranchiseBrand, type FranchiseBrand } from '@/lib/franchise-brand';
import { DEMO_VIEWER } from '@/lib/demo/viewer';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const franchiseResult = resolveFranchiseFromHeaders(requestHeaders);
  if (!franchiseResult.ok) {
    redirect('/select-franchise');
  }

  const franchise = franchiseResult.franchise;
  const brand = getFranchiseBrand(franchise);
  // Public demo: no sign-in. Every visitor is the fictional demo viewer.
  const user: AuthUser = DEMO_VIEWER;
  const navStyle = process.env.NAV_STYLE ?? 'top';

  if (navStyle === 'side') {
    return (
      <Providers franchise={franchise}>
        <ShieldAnimation franchise={franchise} />
        <main className="flex min-h-screen w-full flex-col" style={{ backgroundColor: COLORS.primary }}>
          <DesktopNav brand={brand} />
          <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4 sm:static sm:h-auto sm:border-0 sm:px-6" style={{ backgroundColor: COLORS.primary }}>
              <MobileNavLegacy brand={brand} />
              <DashboardBreadcrumb />
              <SearchInput />
              <User
                fullName={user.fullName}
                email={user.email}
                isSuperAdmin={user.isSuperAdmin}
                allowedFranchises={user.allowedFranchises}
              />
            </header>
            <main className="grid flex-1 items-start gap-2 p-4 sm:px-6 sm:py-0 md:gap-4" style={{ backgroundColor: COLORS.primary }}>
              {children}
            </main>
          </div>
        </main>
      </Providers>
    );
  }

  // Default top bar layout
  return (
    <Providers franchise={franchise}>
        <ShieldAnimation franchise={franchise} />
      <main className="flex min-h-screen w-full flex-col" style={{ backgroundColor: COLORS.primary }}>
        <DashboardContent user={user}>
          {children}
        </DashboardContent>
      </main>
    </Providers>
  );
}

// Legacy sidebar layout components (for NAV_STYLE=side)
function DesktopNav({ brand }: { brand: FranchiseBrand }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
        >
          <Image 
            src={brand.logoPath}
            alt={brand.displayName}
            width={60} 
            height={60} 
            className="transition-all group-hover:scale-110"
          />
          <span className="sr-only">{brand.displayName}</span>
        </Link>

        <NavItemLegacy href="/" label="Dashboard">
          <Home className="h-5 w-5" />
        </NavItemLegacy>

        <NavItemLegacy href="#" label="Analytics">
          <LineChart className="h-5 w-5" />
        </NavItemLegacy>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="#"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
      </nav>
    </aside>
  );
}

function NavItemLegacy({
  href,
  label,
  children
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
        >
          {children}
          <span className="sr-only">{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function MobileNavLegacy({ brand }: { brand: FranchiseBrand }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <SheetHeader>
          <SheetTitle className="sr-only">Main Menu</SheetTitle>
        </SheetHeader>
        <nav className="grid gap-6 text-lg font-medium mt-4">
          <Link
            href="#"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 text-muted-foreground hover:text-foreground md:text-base"
          >
            <Image 
              src={brand.logoPath}
              alt={brand.displayName}
              width={24} 
              height={24} 
              className="transition-all group-hover:scale-110"
            />
            <span className="sr-only">{brand.displayName}</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-4 px-2.5 text-foreground bg-accent rounded-lg"
          >
            <Home className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="#"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <LineChart className="h-5 w-5" />
            Analytics
          </Link>
          <Link
            href="#"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function DashboardBreadcrumb() {
  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Analytics</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
