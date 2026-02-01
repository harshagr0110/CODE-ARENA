import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import type { NextRequest } from "next/server"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/rooms(.*)",
  "/questions(.*)",
  "/api/rooms(.*)",
  "/api/submissions(.*)",
  "/api/games(.*)",
  "/api/questions(.*)",
  "/api/me(.*)",
])

export default clerkMiddleware(async (auth: any, req: NextRequest) => {
  // Only protect if it's a protected route
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
