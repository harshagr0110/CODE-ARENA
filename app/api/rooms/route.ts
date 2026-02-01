import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const rawMaxPlayers = body?.maxPlayers
    const parsedMaxPlayers = Number.parseInt(rawMaxPlayers, 10)
    const safeMaxPlayers = Number.isFinite(parsedMaxPlayers)
      ? Math.min(6, Math.max(2, parsedMaxPlayers))
      : 4

    const privacy = (body?.privacy === "private") ? "private" : "public"

    const name = typeof body?.name === "string" && body.name.trim().length > 0
      ? body.name.trim()
      : `${user.username}'s Room`
    
    // Generate unique join code with better collision handling
    let joinCode = generateJoinCode()
    let attempts = 0
    const maxAttempts = 20
    
    while (attempts < maxAttempts) {
      const existing = await prisma.room.findUnique({ where: { joinCode } })
      if (!existing) break
      joinCode = generateJoinCode()
      attempts++
    }
    
    // Fallback to timestamp-based code if still colliding
    if (attempts >= maxAttempts) {
      joinCode = `${Date.now().toString(36).toUpperCase().slice(-6)}`
    }
    
    try {
      const room = await prisma.room.create({
        data: {
          hostId: user.id,
          joinCode,
          name,
          maxPlayers: safeMaxPlayers,
          privacy: privacy,
          isActive: true,
          participants: [
            { id: user.id, username: user.username },
          ],
        },
      })
      
      return NextResponse.json(room)
    } catch (error: any) {
      // Handle unique constraint violation on joinCode
      if (error.code === 'P2002' && error.meta?.target?.includes('joinCode')) {
        // Retry with new code
        const retryCode = `${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 4).toUpperCase()}`
        const room = await prisma.room.create({
          data: {
            hostId: user.id,
            joinCode: retryCode.slice(-6),
            name,
            maxPlayers: safeMaxPlayers,
            privacy: privacy,
            isActive: true,
            participants: [
              { id: user.id, username: user.username },
            ],
          },
        })
        return NextResponse.json(room)
      }
      throw error
    }
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    )
  }
}
