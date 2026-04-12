import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/domains/auth/service'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Log OAuth authentication (could be login or signup)
      try {
        const isNewUser = data.user.created_at === data.user.last_sign_in_at;
        const provider = data.user.app_metadata?.provider || 'oauth';

        if (isNewUser) {
          await AuthService.logOAuthEvent(data.user.id, data.user.email || '', provider, 'signup');
        } else {
          await AuthService.logOAuthEvent(data.user.id, data.user.email || '', provider, 'login');
        }
      } catch (logError) {
        console.error('Failed to log OAuth event:', logError);
        // Don't block auth flow if logging fails
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
