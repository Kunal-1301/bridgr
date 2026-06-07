import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../store/authStore'

export interface Attachment {
  name: string
  size?: string
  url?: string
  storageKey?: string
}

export interface ChatMessage {
  id: string
  channelId: string
  senderId: string
  senderName: string
  senderRole: 'admin' | 'worker'
  content: string
  attachments?: Attachment[]
  createdAt: string
}

type PresenceMap = Record<string, 'online' | 'offline'>
type SocketEvent =
  | { type: 'message'; message: ChatMessage }
  | { type: 'presence'; userId: string; status: 'online' | 'offline' }
  | ChatMessage

const reconnectDelays = [2000, 5000, 10000, 30000, 30000]

export function useWebSocket(channelId: string) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [presenceMap, setPresenceMap] = useState<PresenceMap>({})
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<number | null>(null)
  const attempts = useRef(0)
  const closedByUnmount = useRef(false)

  const clearReconnect = useCallback(() => {
    if (reconnectTimer.current) {
      window.clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
  }, [])

  const connect = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WS_URL
    if (!wsUrl || !channelId || !accessToken) return

    clearReconnect()
    socketRef.current?.close()

    const url = `${wsUrl}/ws/chat/${encodeURIComponent(channelId)}?token=${encodeURIComponent(accessToken)}`
    const socket = new WebSocket(url)
    socketRef.current = socket

    socket.onopen = () => {
      attempts.current = 0
      setIsConnected(true)
      if (user?.id) {
        setPresenceMap((current) => ({ ...current, [user.id]: 'online' }))
      }
      socket.send(JSON.stringify({ type: 'presence', status: 'online' }))
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as SocketEvent
        if ('type' in payload && payload.type === 'presence') {
          setPresenceMap((current) => ({ ...current, [payload.userId]: payload.status }))
          return
        }
        const message = 'type' in payload && payload.type === 'message' ? payload.message : payload
        if ('content' in message) {
          setMessages((current) => [...current, message])
        }
      } catch {
        // Ignore malformed websocket payloads; server validation handles real protocol errors.
      }
    }

    socket.onclose = () => {
      setIsConnected(false)
      if (closedByUnmount.current) return
      if (attempts.current >= reconnectDelays.length) return
      const delay = reconnectDelays[attempts.current]
      attempts.current += 1
      reconnectTimer.current = window.setTimeout(connect, delay)
    }

    socket.onerror = () => {
      socket.close()
    }
  }, [accessToken, channelId, clearReconnect, user?.id])

  useEffect(() => {
    closedByUnmount.current = false
    connect()
    return () => {
      closedByUnmount.current = true
      clearReconnect()
      socketRef.current?.send(JSON.stringify({ type: 'presence', status: 'offline' }))
      socketRef.current?.close()
    }
  }, [connect, clearReconnect])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        attempts.current = 0
        if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) connect()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [connect])

  const sendMessage = useCallback((content: string, attachments?: Attachment[]) => {
    if (!content.trim() && !attachments?.length) return
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      channelId,
      senderId: user?.id || 'local-user',
      senderName: user?.fullName || user?.email || 'User',
      senderRole: user?.role === 'admin' ? 'admin' : 'worker',
      content,
      attachments,
      createdAt: new Date().toISOString(),
    }
    setMessages((current) => [...current, message])
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'message', message }))
    }
  }, [channelId, user])

  return { messages, sendMessage, isConnected, presenceMap }
}
