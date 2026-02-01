import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: roomId } = await context.params;
    
    // Get the room
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // SECURITY: Only room host can end games
    if (room.hostId !== user.id) {
      return NextResponse.json(
        { error: "Only the room host can end games" },
        { status: 403 }
      );
    }

    // Find the latest game for this room
    const game = await prisma.game.findFirst({
      where: { roomId: roomId }
    });

    if (!game) {
      return NextResponse.json({ error: "No game found" }, { status: 404 });
    }

    // Simple update to mark the room as finished (no longer active)
    await prisma.room.update({
      where: { id: roomId },
      data: { isActive: false }
    });

    return NextResponse.json({
      message: "Game ended successfully",
      roomId,
      gameId: game.id
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to end game" }, { status: 500 });
  }
}
