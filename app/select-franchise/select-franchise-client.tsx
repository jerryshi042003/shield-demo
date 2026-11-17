'use client';

import { useState } from 'react';
import Image from 'next/image';
import { type Franchise } from '@/lib/franchise';
import { getFranchiseBrand } from '@/lib/franchise-brand';

type SetFranchiseResponse = {
  ok?: boolean;
  redirectPath?: string;
};

export function SelectFranchiseClient({
  allowedFranchises
}: {
  allowedFranchises: Franchise[];
}) {
  const [loadingFranchise, setLoadingFranchise] = useState<Franchise | null>(
    null
  );
  const [error, setError] = useState<string>('');

  async function selectFranchise(franchise: Franchise) {
    setLoadingFranchise(franchise);
    setError('');

    try {
      const response = await fetch('/api/auth/superadmin/franchise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ franchise })
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `HTTP ${response.status}`);
      }

      const payload = (await response.json()) as SetFranchiseResponse;
      const redirectPath = payload.redirectPath ?? '/sales/season';

      // Force full reload so all in-memory caches reset for the new franchise context.
      window.location.assign(redirectPath);
    } catch {
      setLoadingFranchise(null);
      setError('Unable to switch franchise right now. Please try again.');
    }
  }

  return (
    <main className="min-h-screen w-full bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <h1 className="text-center text-3xl font-semibold text-gray-900">
          Choose a franchise
        </h1>

        <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
          {allowedFranchises.map((franchise) => {
            const brand = getFranchiseBrand(franchise);
            const isLoading = loadingFranchise === franchise;
            const isGalaxy = franchise === 'LAG';

            return (
              <button
                key={franchise}
                type="button"
                onClick={() => void selectFranchise(franchise)}
                disabled={loadingFranchise !== null}
                aria-label={`Open ${brand.displayName}`}
                className="group flex min-h-52 flex-col items-center justify-center gap-5 rounded-2xl border border-gray-200 bg-white px-6 py-8 text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                <Image
                  src={brand.logoPath}
                  alt=""
                  width={isGalaxy ? 76 : 96}
                  height={isGalaxy ? 76 : 96}
                  className={
                    isGalaxy
                      ? 'h-[4.75rem] w-[4.75rem] object-contain'
                      : 'h-24 w-24 object-contain'
                  }
                  priority
                />
                <span className="text-base font-semibold">
                  {isLoading ? 'Opening…' : brand.displayName}
                </span>
              </button>
            );
          })}
        </div>

        {error ? <p className="mt-6 text-sm text-rose-600">{error}</p> : null}
      </div>
    </main>
  );
}
