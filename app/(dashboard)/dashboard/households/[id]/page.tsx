import { getHouseholdById } from '@/app/actions/households'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HouseholdSettings from '@/components/households/HouseholdSettings'

export default async function HouseholdPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: household, error } = await getHouseholdById(id)

  if (error || !household) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <HouseholdSettings household={household} currentUserId={user.id} />
    </div>
  )
}
