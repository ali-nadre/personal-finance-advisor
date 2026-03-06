/**
 * AI advisor client — uses Google Gemini 1.5 Flash (free tier).
 * Get your API key at aistudio.google.com → "Get API key"
 * Set GOOGLE_AI_API_KEY in .env.local and in Vercel environment variables.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not set')
  }
  return new GoogleGenerativeAI(apiKey)
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AdvisorResponse {
  content: string
  tokensUsed: number
}

export async function chatWithAdvisor(
  systemPrompt: string,
  conversationHistory: ChatMessage[],
  userMessage: string
): Promise<AdvisorResponse> {
  const genAI = getClient()
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  })

  // Gemini uses 'model' instead of 'assistant' for the AI role
  const history = conversationHistory.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const chat = model.startChat({ history })
  const result = await chat.sendMessage(userMessage)
  const content = result.response.text()
  const tokensUsed = result.response.usageMetadata?.totalTokenCount ?? 0

  return { content, tokensUsed }
}

export async function generateInsights(systemPrompt: string): Promise<string> {
  const genAI = getClient()
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  })

  const result = await model.generateContent(
    'Based on my financial data, give me your top 3 most important insights and recommendations. Format each as: [TYPE]: Title — Explanation (TYPE is one of: WARNING, TIP, OPPORTUNITY)'
  )
  return result.response.text()
}
