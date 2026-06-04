'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

const SUGGESTIONS = [
  'Revenue this week vs last week',
  'Occupancy today vs yesterday',
  'Which channel drives the most revenue this month?',
  'How many arrivals today?',
  'Compare this month vs last month',
  'What is the RevPAR trend this week?',
]

function parseText(text: string) {
  // Render **bold** and line breaks
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return (
      <span key={i}>
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j} className="font-semibold text-white">{part.slice(2, -2)}</strong>
            : <span key={j}>{part}</span>
        )}
        {i < lines.length - 1 && <br />}
      </span>
    )
  })
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
        ${isUser ? 'bg-violet-600' : 'bg-slate-700'}`}>
        {isUser
          ? <User size={13} className="text-white" />
          : <Bot size={13} className="text-violet-400" />
        }
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser
          ? 'bg-violet-600 text-white rounded-tr-sm'
          : message.error
            ? 'bg-red-500/10 border border-red-500/30 text-red-300 rounded-tl-sm'
            : 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-sm'
        }`}>
        {isUser ? message.content : parseText(message.content)}
      </div>
    </div>
  )
}

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(question: string) {
    if (!question.trim() || loading) return

    const userMsg: Message = { role: 'user', content: question.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      // Build history excluding the message we just added (API will get it via `question`)
      const history = messages.map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), history }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setMessages([...updated, { role: 'assistant', content: data.error ?? 'Something went wrong.', error: true }])
      } else {
        setMessages([...updated, { role: 'assistant', content: data.answer }])
      }
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Network error. Check your connection and try again.', error: true }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="mb-5 flex-shrink-0">
        <h1 className="text-2xl font-bold text-white">Ask</h1>
        <p className="text-slate-400 text-sm mt-1">Ask anything about Fools Inn — occupancy, revenue, channels, comparisons</p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center pb-8">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-5">
              <Sparkles size={22} className="text-violet-400" />
            </div>
            <h2 className="text-white font-semibold text-lg mb-1">Ask anything about your hotel</h2>
            <p className="text-slate-500 text-sm mb-8 max-w-sm">
              Compare periods, analyse channels, or get a quick status — all from live Cloudbeds data.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50
                    hover:bg-slate-700/50 hover:border-violet-500/30 transition-all text-slate-300 text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 px-1">
            {messages.map((m, i) => <MessageBubble key={i} message={m} />)}

            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={13} className="text-violet-400" />
                </div>
                <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Loader2 size={13} className="animate-spin" />
                    <span>Fetching data from Cloudbeds…</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-4 border-t border-slate-800">
        {messages.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {['This week vs last', 'Today\'s status', 'Top channel'].map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50
                  hover:bg-slate-700/50 hover:border-violet-500/30 transition-all text-slate-400 text-xs
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about revenue, occupancy, channels…"
            disabled={loading}
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm
              text-white placeholder-slate-500 outline-none
              focus:border-violet-500/50 focus:bg-slate-800
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl bg-violet-600 hover:bg-violet-700 flex items-center justify-center
              disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {loading ? <Loader2 size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
          </button>
        </div>
        <p className="text-slate-600 text-xs mt-2 text-center">Enter to send · Powered by Claude</p>
      </div>
    </div>
  )
}
