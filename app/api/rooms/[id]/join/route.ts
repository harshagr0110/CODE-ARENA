import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Join a room by ID using the database (keeps new project's features; fixes join flow)
export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const room = await prisma.room.findUnique({ where: { id } })
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Standardized participant parsing
    let participants: any[] = []
    try {
      participants = Array.isArray(room.participants)
        ? (room.participants as any[])
        : JSON.parse(room.participants as unknown as string)
    } catch (e) {
      participants = []
    }

    const maxPlayers = typeof room.maxPlayers === "number" ? room.maxPlayers : 10

    if (participants.length >= maxPlayers) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 })
    }

    if (!room.isActive) {
      return NextResponse.json({ error: "Room is not active" }, { status: 400 })
    }

    if (participants.some((p: any) => p.id === user.id)) {
      return NextResponse.json({ message: "Already in room" })
    }

    participants.push({ id: user.id, username: user.username })

    await prisma.room.update({
      where: { id },
      data: { participants },
    })

    return NextResponse.json({ message: "Joined room successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
