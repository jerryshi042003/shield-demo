'use client';

import Image from 'next/image';
import { useFranchise } from '@/app/(dashboard)/franchise-context';
import { getFranchiseBrand } from '@/lib/franchise-brand';

interface AppLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function AppLogo({ width = 60, height = 60, className = "block select-none" }: AppLogoProps) {
  const { franchise } = useFranchise();
  const brand = getFranchiseBrand(franchise);
  const lagScale = franchise === 'LAG' ? 0.86 : 1;
  const resolvedWidth = Math.round(width * lagScale);
  const resolvedHeight = Math.round(height * lagScale);

  return (
    <Image
      src={brand.logoPath}
      alt={brand.displayName}
      width={resolvedWidth}
      height={resolvedHeight}
      className={`${className} object-contain`}
      priority
    />
  );
}
