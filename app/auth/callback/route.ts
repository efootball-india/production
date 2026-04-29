// PASS-2-AUTH-CALLBACK
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`);
    }
    // Check if the user has completed onboarding (has a players row)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: player } = await supabase
        .from('players')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();
      if (!player) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
      return NextResponse.redirect(`${origin}/`);
    }
  }
  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
