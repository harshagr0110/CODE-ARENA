import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id: roomId } = await context.params;
    const room = await prisma.room.findUnique({ 
      where: { id: roomId },
      include: {
        games: {
          where: { endedAt: null },
          select: { id: true }
        }
      }
    })
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 })
    
    // Standardized participant parsing
    let participants: any[] = []
    try {
      participants = Array.isArray(room.participants)
        ? (room.participants as any[])
        : JSON.parse(room.participants as unknown as string)
    } catch (e) {
      participants = []
    }

    const isHost = room.hostId === user.id
    if (isHost) {
      // CRITICAL: Check if game is in progress
      const hasActiveGame = room.games.length > 0
      if (hasActiveGame) {
        return NextResponse.json({ 
          error: "Cannot leave while game is in progress. End the game first or disqualify yourself." 
        }, { status: 400 })
      }
      
      // If host leaves and no active games, delete the room
      // Any completed games will be cleaned up via cascade delete
      await prisma.room.delete({ where: { id: roomId } })
      return NextResponse.json({ message: "Host left, room deleted" })
    } else {
      participants = participants.filter((p: any) => p.id !== user.id)
      await prisma.room.update({ where: { id: roomId }, data: { participants } })
      return NextResponse.json({ message: "Left room successfully" })
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}