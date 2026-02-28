import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserHouseholds } from '@/app/actions/households'
import OnboardingForm from '@/components/onboarding/OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Already has a household — skip onboarding
  const { data: households } = await getUserHouseholds()
  if (households && households.length > 0) {
    redirect('/dashboard')
  }

  const firstName = user.user_metadata?.full_name?.split(' ')[0] || ''

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900">
            {firstName ? `Welcome, ${firstName}!` : 'Welcome to FinanceOS!'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Let&apos;s set up your household. You can invite others to collaborate later.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  )
}
