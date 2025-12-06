import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/welcome', '/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl
  const authObject = await auth()

  // Redirect authenticated users from welcome page to dashboard
  if (pathname === '/welcome' && authObject.userId) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Special handling for root path - Delegates to client-side protection to avoid loops
  if (pathname === '/') {
    // We allow access to root even if not authenticated initially, 
    // to let the Client Component handle the redirect if needed.
    // This prevents middleware/client state mismatch loops.
    return NextResponse.next()
  }

  // For other routes, check if public or protect
  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  // Always return NextResponse for public routes
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}