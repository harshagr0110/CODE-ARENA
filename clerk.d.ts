declare module '@clerk/nextjs/server' {
  export function auth(): Promise<any>
  export function clerkMiddleware(handler: (auth: any, req: any) => Promise<void>): any
  export function createRouteMatcher(matchers: string[]): (req: any) => boolean
}
