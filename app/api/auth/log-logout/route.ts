/**
 * API Route: Log user logout event
 * POST /api/auth/log-logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/domains/auth/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    // Log logout event
    await AuthService.logLogout(userId, email);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to log logout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to log logout event' },
      { status: 500 }
    );
  }
}
