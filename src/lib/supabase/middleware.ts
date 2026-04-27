import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
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
        setAll(cookiesToSet) {
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

  // Refresh session if expired - critical for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Routes that require authentication
  const protectedPaths = ['/home', '/onboarding', '/profile', '/tournaments'];
  // Routes that should redirect if already authenticated
  const authPaths = ['/signin', '/signup', '/verify'];
  // Public routes (welcome page is at /)
  const publicPaths = ['/', '/prototype.html'];

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPath = authPaths.some((p) => pathname.startsWith(p));

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Don't redirect away from /onboarding even if signed in - they need to complete it
  if (user && isAuthPath && pathname !== '/verify') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return supabaseResponse;
}
