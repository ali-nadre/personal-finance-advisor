/**
 * Claude API client for the Pro tier AI advisor.
 * Uses the Anthropic SDK with a server-side API key.
 */

import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables')
    }
    _client = new Anthropic({ apiKey })
  }
  return _client
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
  const client = getClient()

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ]

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001', // Fast + cheap for conversational advisor
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : ''
  const tokensUsed = response.usage.input_tokens + response.usage.output_tokens

  return { content, tokensUsed }
}

export async function generateInsights(
  systemPrompt: string
): Promise<string> {
  const client = getClient()

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: 'Based on my financial data, give me your top 3 most important insights and recommendations. Format each as: [TYPE]: Title — Explanation (TYPE is one of: WARNING, TIP, OPPORTUNITY)',
      },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
