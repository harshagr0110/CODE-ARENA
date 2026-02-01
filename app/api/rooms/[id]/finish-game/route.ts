import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: roomId } = await params

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    // Verify the user is the host of the room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (room.hostId !== user.id) {
      return NextResponse.json(
        { error: "Only the room host can finish the game" },
        { status: 403 }
      )
    }

    // CRITICAL FIX: Only mark room as inactive, don't delete data
    // Users may want to view game results after finishing
    await prisma.room.update({
      where: { id: roomId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: "Room finished successfully",
    })
  } catch (error) {
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
