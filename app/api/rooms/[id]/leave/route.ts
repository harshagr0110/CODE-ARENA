import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id: roomId } = await context.params;
    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 })
    let participants: any[] = [];
    if (Array.isArray(room.participants)) {
      participants = room.participants as any[];
    } else if (typeof room.participants === 'string') {
      try {
        participants = JSON.parse(room.participants);
      } catch {
        participants = [];
      }
    }
    const isHost = room.hostId === user.id
    if (isHost) {
      // If host leaves, just delete the room (don't create a game)
      // Any active games will be cleaned up via cascade delete
      await prisma.room.delete({ where: { id: roomId } })
      return NextResponse.json({ message: "Host left, room deleted" })
    } else {
      participants = participants.filter((p: any) => p.id !== user.id)
      await prisma.room.update({ where: { id: roomId }, data: { participants: JSON.stringify(participants) } })
      return NextResponse.json({ message: "Left room successfully" })
    }
  } catch (error) {
    console.error("Error leaving room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}