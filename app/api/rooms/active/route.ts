import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  // Only return active rooms
  const rooms = await prisma.room.findMany({ where: { isActive: true } })
  // Participants is already an array from Prisma, no need to parse
  const parsedRooms = rooms.map((room: any) => ({
    ...room,
    participants: Array.isArray(room.participants)
      ? room.participants
      : typeof room.participants === 'string'
      ? JSON.parse(room.participants)
      : []
  }))
  return NextResponse.json({ rooms: parsedRooms })
}
