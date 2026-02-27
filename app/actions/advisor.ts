'use server'

import { createClient } from '@/lib/supabase/server'
import { runRuleEngine, type RuleInput } from '@/lib/advisor/rule-engine'
import { buildFinancialContext } from '@/lib/advisor/context-builder'
import { chatWithAdvisor, generateInsights, type ChatMessage } from '@/lib/advisor/claude-client'
import { getBudgetSummary } from './budgets'
import { getMonthlyTransactionSummary, getBudgetVsActual, getTransactions } from './transactions'
import { getHealthScore } from './healthScore'

// ─── Build rule engine input from household data ──────────────────────────────

async function buildRuleInput(householdId: string): Promise<RuleInput | null> {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [
    { data: summary },
    { data: monthlySummary },
    { data: budgetVsActual },
    { data: transactions },
  ] = await Promise.all([
    getBudgetSummary(householdId, year),
    getMonthlyTransactionSummary(householdId, year, month),
    getBudgetVsActual(householdId, year, month),
    getTransactions(householdId, {
      date_from: `${year}-${String(month).padStart(2, '0')}-01`,
      date_to: new Date(year, month, 0).toISOString().split('T')[0],
    }),
  ])

  if (!summary) return null

  const expensesByCategory: Record<string, number> = {}
  const incomeCategoryCount = summary.byCategory.filter((c) => c.categoryType === 'income').length

  summary.byCategory
    .filter((c) => c.categoryType === 'expense')
    .forEach((c) => {
      expensesByCategory[c.categoryName] = c.total / 12
    })

  const actualByCategory: Record<string, number> = {}
  transactions?.forEach((tx) => {
    if (tx.type === 'expense') {
      actualByCategory[tx.category.name] = (actualByCategory[tx.category.name] || 0) + tx.amount
    }
  })

  const monthlyBudgetedExpenses =
    budgetVsActual?.filter((b) => b.categoryType === 'expense').reduce((s, b) => s + b.budgeted, 0) ?? 0
  const monthlyBudgetedIncome =
    budgetVsActual?.filter((b) => b.categoryType === 'income').reduce((s, b) => s + b.budgeted, 0) ?? 0

  const savingsRatePercent =
    summary.totalIncome > 0
      ? ((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100
      : 0

  return {
    annualIncome: summary.totalIncome,
    annualExpenses: summary.totalExpense,
    monthlyBudgetedIncome,
    monthlyBudgetedExpenses,
    monthlyActualIncome: monthlySummary?.totalIncome ?? 0,
    monthlyActualExpenses: monthlySummary?.totalExpense ?? 0,
    expensesByCategory,
    actualByCategory,
    savingsRatePercent,
    expenseCategoryCount: Object.keys(expensesByCategory).length,
    incomeCategoryCount,
  }
}

// ─── Generate & persist rule-based insights ───────────────────────────────────

export async function refreshInsights(householdId: string) {
  const supabase = await createClient()

  const ruleInput = await buildRuleInput(householdId)
  if (!ruleInput) return { error: 'Could not load financial data' }

  const insights = runRuleEngine(ruleInput)

  if (insights.length === 0) return { error: null }

  // Replace existing unread rule engine insights to avoid stale duplicates
  await supabase
    .from('advisor_insights')
    .delete()
    .eq('household_id', householdId)
    .eq('source', 'rule_engine')
    .eq('is_read', false)
    .eq('is_dismissed', false)

  const rows = insights.map((insight) => ({
    household_id: householdId,
    type: insight.type,
    title: insight.title,
    body: insight.body,
    source: 'rule_engine',
    priority: insight.priority,
  }))

  const { error } = await supabase.from('advisor_insights').insert(rows)
  if (error) return { error: error.message }

  return { error: null }
}

// ─── Get insights for display ─────────────────────────────────────────────────

export async function getInsights(householdId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('advisor_insights')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_dismissed', false)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function markInsightRead(insightId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('advisor_insights')
    .update({ is_read: true })
    .eq('id', insightId)
  return { error: error?.message ?? null }
}

export async function dismissInsight(insightId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('advisor_insights')
    .update({ is_dismissed: true })
    .eq('id', insightId)
  return { error: error?.message ?? null }
}

// ─── Pro: Conversations ───────────────────────────────────────────────────────

export async function createConversation(householdId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('advisor_conversations')
    .insert({ household_id: householdId, user_id: user.id })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getConversations(householdId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('advisor_conversations')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getMessages(conversationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('advisor_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function sendMessage(
  conversationId: string,
  householdId: string,
  userMessage: string
): Promise<{ data: { content: string } | null; error: string | null }> {
  const supabase = await createClient()

  // Get conversation history
  const { data: history } = await getMessages(conversationId)
  const chatHistory: ChatMessage[] = (history ?? []).map((m: { role: string; content: string }) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // Build financial context for system prompt
  const [ruleInput, { data: healthScore }] = await Promise.all([
    buildRuleInput(householdId),
    getHealthScore(householdId),
  ])

  if (!ruleInput) return { data: null, error: 'Could not load financial data' }

  const systemPrompt = buildFinancialContext(ruleInput, healthScore)

  // Call Claude
  let response: { content: string; tokensUsed: number }
  try {
    response = await chatWithAdvisor(systemPrompt, chatHistory, userMessage)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Advisor] Claude API error:', message)
    return { data: null, error: `AI advisor error: ${message}` }
  }

  // Persist both messages
  await supabase.from('advisor_messages').insert([
    { conversation_id: conversationId, role: 'user', content: userMessage },
    { conversation_id: conversationId, role: 'assistant', content: response.content, tokens_used: response.tokensUsed },
  ])

  return { data: { content: response.content }, error: null }
}
