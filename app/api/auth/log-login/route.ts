/**
 * API Route: Log user login event
 * POST /api/auth/log-login
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthService } from '@/lib/domains/auth/service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider = 'email' } = body;

    // Log login event
    if (provider === 'email') {
      await AuthService.logLogin(user.id, user.email);
    } else {
      await AuthService.logOAuthEvent(user.id, user.email, provider, 'login');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to log login:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to log login event' },
      { status: 500 }
    );
  }
}
