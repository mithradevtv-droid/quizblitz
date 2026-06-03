import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

let socket = null

export function getSocket() {
  if (!socket) {
    socket = io({ path: '/socket.io' })
  }
  return socket
}

export function useSocket() {
  const socketRef = useRef(null)
  useEffect(() => {
    socketRef.current = getSocket()
    return () => {}
  }, [])
  return socketRef
}
