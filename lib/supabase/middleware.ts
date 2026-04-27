import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // PUBLIC HOMEPAGE: rewrite root to the prototype HTML.
  // URL stays as eftbl.vercel.app — the prototype loads in-place.
  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/prototype.html', request.url));
  }

  // For all other paths: keep Supabase session fresh, but do NOT enforce auth.
  // Anyone can visit /signin, /signup, /home, /onboarding — auth is optional in v1.
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - critical for Server Components that read user state
  await supabase.auth.getUser();

  return supabaseResponse;
}
