import Image from 'next/image';
import type { Franchise } from '@/lib/franchise';
import { getFranchiseBrand } from '@/lib/franchise-brand';

/** A short opening moment; content and inputs remain usable throughout. */
export function ShieldAnimation({ franchise }: { franchise: Franchise }) {
  const brand = getFranchiseBrand(franchise);
  return (
    <div
      aria-hidden="true"
      className="shield-arrival pointer-events-none fixed right-5 top-20 z-40 hidden items-center sm:flex gap-2 rounded-xl bg-white px-3 py-2 shadow-lg"
    >
      <Image
        src={brand.logoPath}
        alt=""
        width={36}
        height={44}
        className="h-11 w-9 object-contain"
        priority
      />
      <span className="text-lg font-bold text-[#102a50]">Shield</span>
    </div>
  );
}
