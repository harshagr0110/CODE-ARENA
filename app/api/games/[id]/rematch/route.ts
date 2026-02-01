import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as socketClient from 'socket.io-client'

const socket = socketClient.connect('http://localhost:3001')

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: roomId } = await context.params;
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }
    // Get room and verify user is the creator
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    })
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }
    if (room.hostId !== user.id) {
      return NextResponse.json({ error: "Only the host can start a rematch" }, { status: 403 })
    }
    // Reset the room for a new game (isActive: true, clear challenge, winner, etc.)
    await prisma.room.update({
      where: { id: roomId },
      data: {
        isActive: true,
      },
    })
    // Notify all players via socket
    socket.emit("rematch-waiting", { roomId })
    return NextResponse.redirect(`/rooms/${roomId}`)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
