/**
 * API Route: Log user signup event
 * POST /api/auth/log-signup
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

    // Log signup event
    if (provider === 'email') {
      await AuthService.logSignup(user.id, user.email, {
        firstName: user.user_metadata?.first_name,
        lastName: user.user_metadata?.last_name,
      });
    } else {
      await AuthService.logOAuthEvent(user.id, user.email, provider, 'signup');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to log signup:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to log signup event' },
      { status: 500 }
    );
  }
}
