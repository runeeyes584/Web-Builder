import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/welcome', '/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl
  const authObject = await auth()
  
  // Special handling for root path
  if (pathname === '/') {
    if (!authObject.userId) {
      // Not authenticated - redirect to welcome
      return NextResponse.redirect(new URL('/welcome', request.url))
    }
    // Authenticated - allow access to root
    return NextResponse.next()
  }
  
  // For other routes, check if public or protect
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}