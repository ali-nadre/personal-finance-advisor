import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getHouseholdById } from '@/app/actions/households'
import { getScenario } from '@/app/actions/scenarios'
import { getBudgetItems } from '@/app/actions/budgets'
import { budgetItemsToScenarioItems } from '@/lib/scenarios/projection-engine'
import { formatCurrency } from '@/lib/currency'
import ScenarioProjectionSection from '@/components/scenarios/ScenarioProjectionSection'
import ScenarioItemRow from '@/components/scenarios/ScenarioItemRow'
import AddScenarioItemForm from '@/components/scenarios/AddScenarioItemForm'
import ArchiveScenarioButton from '@/components/scenarios/ArchiveScenarioButton'
import type { ScenarioItem } from '@/types/database'

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ id: string; scenarioId: string }>
}) {
  const { id, scenarioId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: household }, { data: scenario }, { data: budgetItems }] = await Promise.all([
    getHouseholdById(id),
    getScenario(scenarioId),
    getBudgetItems(id, new Date().getFullYear()),
  ])

  if (!household) redirect('/dashboard')
  if (!scenario) redirect(`/dashboard/households/${id}/scenarios`)

  const currency = household.currency
  const items = scenario.items ?? []

  const incomeItems = items.filter((i: ScenarioItem) => i.category_type === 'income')
  const expenseItems = items.filter((i: ScenarioItem) => i.category_type === 'expense')

  const monthlyIncome = incomeItems.reduce((s: number, i: ScenarioItem) => s + i.monthly_amount, 0)
  const monthlyExpenses = expenseItems.reduce((s: number, i: ScenarioItem) => s + i.monthly_amount, 0)
  const monthlyNet = monthlyIncome - monthlyExpenses
  const annualNet = monthlyNet * 12

  const savingsRate = monthlyIncome > 0
    ? Math.round((monthlyNet / monthlyIncome) * 100)
    : 0

  // Budget items for comparison (pass minimal shape to client component)
  const budgetProjectionItems = budgetItems
    ? budgetItemsToScenarioItems(budgetItems)
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href={`/dashboard/households/${id}/scenarios`} className="hover:text-blue-600">
              Scenarios
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">{scenario.name}</span>
          </div>
          {scenario.description && (
            <p className="text-gray-500 text-sm">{scenario.description}</p>
          )}
        </div>
        <ArchiveScenarioButton scenarioId={scenarioId} householdId={id} />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Monthly Income</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(monthlyIncome, currency)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Monthly Expenses</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(monthlyExpenses, currency)}</p>
        </div>
        <div className={`bg-white rounded-xl border p-4 ${monthlyNet >= 0 ? 'border-green-200' : 'border-red-200'}`}>
          <p className="text-xs text-gray-500 mb-1">Monthly Net</p>
          <p className={`text-xl font-bold ${monthlyNet >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {monthlyNet >= 0 ? '+' : ''}{formatCurrency(monthlyNet, currency)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Annual Net</p>
          <p className={`text-xl font-bold ${annualNet >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
            {annualNet >= 0 ? '+' : ''}{formatCurrency(annualNet, currency)}
          </p>
        </div>
      </div>

      {/* Interactive projection chart with year slider */}
      <ScenarioProjectionSection
        items={items}
        currency={currency}
        budgetItems={budgetProjectionItems.length > 0 ? budgetProjectionItems : undefined}
        savingsRate={savingsRate}
      />

      {/* Income + Expense editors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Income
            <span className="ml-auto text-green-700 font-semibold text-base">
              {formatCurrency(monthlyIncome, currency)}/mo
            </span>
          </h3>

          {incomeItems.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No income items yet.</p>
          ) : (
            <div>
              {incomeItems.map((item: ScenarioItem) => (
                <ScenarioItemRow key={item.id} item={item} currency={currency} />
              ))}
            </div>
          )}

          <AddScenarioItemForm scenarioId={scenarioId} defaultType="income" />
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            Expenses
            <span className="ml-auto text-red-600 font-semibold text-base">
              {formatCurrency(monthlyExpenses, currency)}/mo
            </span>
          </h3>

          {expenseItems.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No expense items yet.</p>
          ) : (
            <div>
              {expenseItems.map((item: ScenarioItem) => (
                <ScenarioItemRow key={item.id} item={item} currency={currency} />
              ))}
            </div>
          )}

          <AddScenarioItemForm scenarioId={scenarioId} defaultType="expense" />
        </div>
      </div>
    </div>
  )
}
