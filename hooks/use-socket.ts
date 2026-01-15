
import { useEffect, useState } from "react"
import * as socketClient from "socket.io-client"

export function useSocket() {
  const [socket, setSocket] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_IO_URL || "http://localhost:3001"
    const newSocket = socketClient.connect(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    newSocket.on("connect", () => setIsConnected(true))
    newSocket.on("disconnect", () => setIsConnected(false))
    newSocket.on("connect_error", (error: any) => {
      console.warn("Socket connection error:", error)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  return { socket, isConnected }
}