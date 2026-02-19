import { useState, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const sessionId = useRef(uuidv4())
  const abortRef = useRef(null)

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isStreaming) return

    const userMsg = { id: uuidv4(), role: 'user', content }
    const aiMsg = { id: uuidv4(), role: 'assistant', content: '' }

    setMessages((prev) => [...prev, userMsg, aiMsg])
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: content, session_id: sessionId.current }),
        signal: controller.signal,
      })

      if (!response.ok) throw new Error('Chat request failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const raw = decoder.decode(value, { stream: true })
        const lines = raw.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              setMessages((prev) => {
                const updated = [...prev]
                const last = { ...updated[updated.length - 1] }
                last.content += parsed.content
                updated[updated.length - 1] = last
                return updated
              })
            }
          } catch {
            // skip malformed chunk
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev]
          const last = { ...updated[updated.length - 1] }
          last.content = 'Sorry, something went wrong. Please try again.'
          last.error = true
          updated[updated.length - 1] = last
          return updated
        })
      }
    } finally {
      setIsStreaming(false)
    }
  }, [isStreaming])

  const clearHistory = useCallback(() => {
    setMessages([])
    sessionId.current = uuidv4()
  }, [])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { messages, isStreaming, sendMessage, clearHistory, stopStreaming }
}
