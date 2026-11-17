import { NextResponse } from 'next/server';
import { getDefaultPathForFranchise } from '@/lib/franchise-navigation';
import { normalizeFranchise } from '@/lib/franchise';
import {
  getAllowedFranchisesForViewer,
  SUPERADMIN_FRANCHISE_COOKIE
} from '@/lib/auth/superadmin';

type SuperAdminFranchiseRequest = {
  franchise?: string;
};

export async function POST(request: Request) {
  let payload: SuperAdminFranchiseRequest = {};
  try {
    payload = (await request.json()) as SuperAdminFranchiseRequest;
  } catch {
    payload = {};
  }

  const franchise = normalizeFranchise(payload.franchise);
  if (!franchise || !getAllowedFranchisesForViewer().includes(franchise)) {
    return NextResponse.json(
      {
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid franchise value'
        }
      },
      { status: 400 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    franchise,
    redirectPath: getDefaultPathForFranchise(franchise)
  });

  response.cookies.set(SUPERADMIN_FRANCHISE_COOKIE, franchise, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24
  });

  return response;
}
