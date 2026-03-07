import { createClient } from '@/lib/supabase/server'

/**
 * Require authentication. Returns the authenticated user or an error.
 */
export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, supabase, error: 'Not authenticated' as const }
  }

  return { user, supabase, error: null }
}

/**
 * Require that the authenticated user is a member of the given household.
 * Returns the user, supabase client, and membership info.
 */
export async function requireHouseholdMember(householdId: string) {
  const { user, supabase, error } = await requireAuth()
  if (error || !user) {
    return { user: null, supabase, error: 'Not authenticated' as const }
  }

  // Check: user is either the household creator or an explicit member
  const { data: household } = await supabase
    .from('households')
    .select('id, created_by')
    .eq('id', householdId)
    .single()

  if (!household) {
    return { user: null, supabase, error: 'Household not found' as const }
  }

  if (household.created_by === user.id) {
    return { user, supabase, error: null }
  }

  const { data: member } = await supabase
    .from('household_members')
    .select('id, permission')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return { user: null, supabase, error: 'Access denied' as const }
  }

  return { user, supabase, error: null }
}

/**
 * Require that the authenticated user owns the household (is the creator).
 */
export async function requireHouseholdOwner(householdId: string) {
  const { user, supabase, error } = await requireAuth()
  if (error || !user) {
    return { user: null, supabase, error: 'Not authenticated' as const }
  }

  const { data: household } = await supabase
    .from('households')
    .select('id')
    .eq('id', householdId)
    .eq('created_by', user.id)
    .single()

  if (!household) {
    return { user: null, supabase, error: 'Access denied' as const }
  }

  return { user, supabase, error: null }
}
