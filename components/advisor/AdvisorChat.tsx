'use client'

import { useState, useRef, useEffect } from 'react'
import { sendMessage, createConversation } from '@/app/actions/advisor'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  householdId: string
  initialConversationId?: string
}

export default function AdvisorChat({ householdId, initialConversationId }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId ?? null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setError('')
    setLoading(true)

    // Create conversation on first message
    let convId = conversationId
    if (!convId) {
      const { data, error: convError } = await createConversation(householdId)
      if (convError || !data) {
        setError('Could not start conversation.')
        setLoading(false)
        return
      }
      convId = data.id
      setConversationId(convId)
    }

    // Optimistically add user message
    setMessages((prev) => [...prev, { role: 'user', content: text }])

    const { data, error: msgError } = await sendMessage(convId!, householdId, text)

    setLoading(false)

    if (msgError || !data) {
      setError(msgError ?? 'Something went wrong.')
      return
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: data.content }])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🤖</p>
            <p className="font-medium text-gray-600 mb-1">Your AI Financial Advisor</p>
            <p className="text-sm">Ask me anything about your finances.</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[
                'How can I improve my savings rate?',
                'Where should I cut expenses?',
                'Am I on track financially?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs font-medium text-gray-500">AI Advisor</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your financial advisor..."
            rows={1}
            className="flex-1 resize-none px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex-shrink-0"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Powered by Google Gemini · Your data stays private
        </p>
      </div>
    </div>
  )
}
