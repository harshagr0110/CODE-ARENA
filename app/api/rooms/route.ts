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

    const { name, maxPlayers, mode } = await request.json()
    let joinCode = generateJoinCode()
    let attempts = 0
    while (
      await prisma.room.findUnique({ where: { joinCode } }) &&
      attempts < 10
    ) {
      joinCode = generateJoinCode()
      attempts++
    }
    if (attempts >= 10) {
      joinCode = Date.now().toString(36).toUpperCase().slice(-6)
    }
    
    const room = await prisma.room.create({
      data: {
        hostId: user.id,
        joinCode,
        name: name || `${user.username}'s Room`,
        maxPlayers: maxPlayers || 4,
        mode: mode || "normal",
        status: "waiting",
        // Store participants as JSON array
        participants: JSON.stringify([
          { id: user.id, username: user.username },
        ]),
      },
    })
    
    return NextResponse.json(room)
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
