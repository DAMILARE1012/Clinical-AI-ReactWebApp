import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare,
  X,
  Send,
  Trash2,
  BrainCircuit,
  StopCircle,
  User,
} from 'lucide-react'
import { useChat } from '../../hooks/useChat'

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-end">
      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
        <BrainCircuit size={14} className="text-brand-600" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-2 items-end ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-brand-600' : 'bg-brand-100'
        }`}
      >
        {isUser ? (
          <User size={13} className="text-white" />
        ) : (
          <BrainCircuit size={14} className="text-brand-600" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-brand-600 text-white rounded-br-sm'
            : `bg-white border border-gray-200 text-gray-800 rounded-bl-sm ai-prose ${
                msg.error ? 'border-red-200 bg-red-50 text-red-700' : ''
              }`
        }`}
      >
        {msg.content || (
          <span className="italic opacity-60 text-xs">Thinking…</span>
        )}
      </div>
    </div>
  )
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const { messages, isStreaming, sendMessage, clearHistory, stopStreaming } = useChat()
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  // Focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const submit = (e) => {
    e?.preventDefault()
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-brand-700 to-brand-600 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <BrainCircuit size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Research Assistant</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-xs text-indigo-200">
                    {isStreaming ? 'Thinking...' : 'Online · Shared knowledge base'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                  title="Clear conversation"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mb-3">
                  <BrainCircuit size={26} className="text-brand-500" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Ask about any research
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  I have access to all projects, experiment logs, and results across
                  the team's shared knowledge base.
                </p>
                <div className="mt-4 space-y-2 w-full">
                  {[
                    'What projects are currently active?',
                    'Summarise the results from Batch 3',
                    'Which experiments used a control group?',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); inputRef.current?.focus() }}
                      className="w-full text-left text-xs text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-100 rounded-lg px-3 py-2 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <Message key={msg.id} msg={msg} />
                ))}
                {isStreaming && messages[messages.length - 1]?.role === 'user' && (
                  <TypingIndicator />
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 bg-white">
            <form onSubmit={submit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about any research project or experiment…"
                rows={1}
                className="flex-1 resize-none input-field py-2 text-sm max-h-28 overflow-y-auto"
                style={{ minHeight: '38px' }}
                disabled={isStreaming}
              />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                  title="Stop"
                >
                  <StopCircle size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={15} />
                </button>
              )}
            </form>
            <p className="text-center text-xs text-gray-300 mt-2">
              Powered by Groq · Pinecone RAG
            </p>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="fixed bottom-5 right-5 w-14 h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center"
        title="Open Research Assistant"
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}
        {!open && messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full text-xs font-bold flex items-center justify-center">
            {messages.filter((m) => m.role === 'assistant').length}
          </span>
        )}
      </button>
    </>
  )
}
