'use server'

import { createClient } from '@/lib/supabase/server'
import { requireHouseholdOwner } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import type {
  CreateHouseholdInput,
  UpdateHouseholdInput,
  AddMemberInput,
  UpdateMemberPermissionInput,
  Household,
  HouseholdWithMembers,
} from '@/types/database'

export async function createHousehold(input: CreateHouseholdInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('households')
    .insert({
      name: input.name,
      currency: input.currency || 'USD',
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { data }
}

export async function getUserHouseholds(): Promise<{
  data?: Household[]
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Only return households the user created or is a member of
  const { data: memberRows } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)

  const memberHouseholdIds = (memberRows || []).map((m) => m.household_id)

  const { data, error } = await supabase
    .from('households')
    .select('*')
    .or(`created_by.eq.${user.id}${memberHouseholdIds.length > 0 ? `,id.in.(${memberHouseholdIds.join(',')})` : ''}`)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: 'Failed to fetch households' }
  }

  return { data: data || [] }
}

export async function getHouseholdById(
  householdId: string
): Promise<{ data?: HouseholdWithMembers; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get household
  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single()

  if (householdError) {
    return { error: householdError.message }
  }

  // Get members (simplified - just IDs for now)
  const { data: members, error: membersError } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', householdId)

  if (membersError) {
    return { error: membersError.message }
  }

  // For MVP: Create members with placeholder user data
  // TODO: Create a users table or use Supabase auth API properly
  const membersWithUsers = (members || []).map((member) => ({
    ...member,
    user: {
      email: member.user_id, // Show user ID as email for now
      user_metadata: { full_name: 'Member' },
    },
  }))

  return {
    data: {
      ...household,
      members: membersWithUsers,
    } as HouseholdWithMembers,
  }
}

export async function updateHousehold(input: UpdateHouseholdInput) {
  const { error: ownerError } = await requireHouseholdOwner(input.id)
  if (ownerError) return { error: ownerError }

  const supabase = await createClient()
  const updateData: Record<string, unknown> = { name: input.name.trim().slice(0, 200) }
  if (input.currency !== undefined) {
    updateData.currency = input.currency
  }

  const { data, error } = await supabase
    .from('households')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single()

  if (error) return { error: 'Failed to update household' }

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/households/${input.id}`)
  return { data }
}

export async function deleteHousehold(householdId: string) {
  const { error: ownerError } = await requireHouseholdOwner(householdId)
  if (ownerError) return { error: ownerError }

  const supabase = await createClient()
  const { error } = await supabase.from('households').delete().eq('id', householdId)

  if (error) return { error: 'Failed to delete household' }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function addMemberToHousehold(input: AddMemberInput) {
  const { user, error: ownerError } = await requireHouseholdOwner(input.household_id)
  if (ownerError || !user) return { error: ownerError || 'Not authenticated' }

  const email = input.user_email?.trim().toLowerCase()
  if (!email) return { error: 'Email is required' }

  const supabase = await createClient()

  // Create a pending invite — works whether or not the user has an account yet.
  // When the invited user logs in, processInvites() auto-adds them.
  const { error } = await supabase
    .from('household_invites')
    .insert({
      household_id: input.household_id,
      invited_email: email,
      invited_by: user.id,
      permission: input.permission || 'write',
    })

  if (error) {
    if (error.code === '23505') {
      return { error: 'An invite for that email already exists' }
    }
    return { error: 'Failed to send invite' }
  }

  revalidatePath(`/dashboard/households/${input.household_id}`)
  return { data: { invited_email: email } }
}

export async function getPendingInvites(householdId: string) {
  const { error: ownerError } = await requireHouseholdOwner(householdId)
  if (ownerError) return { data: null, error: ownerError }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('household_invites')
    .select('id, invited_email, permission, created_at')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: 'Failed to fetch invites' }
  return { data, error: null }
}

export async function cancelInvite(inviteId: string) {
  const supabase = await createClient()

  const { data: invite } = await supabase
    .from('household_invites')
    .select('household_id')
    .eq('id', inviteId)
    .single()

  if (!invite) return { error: 'Invite not found' }

  const { error: ownerError } = await requireHouseholdOwner(invite.household_id)
  if (ownerError) return { error: ownerError }

  const { error } = await supabase
    .from('household_invites')
    .delete()
    .eq('id', inviteId)

  if (error) return { error: 'Failed to cancel invite' }

  revalidatePath(`/dashboard/households/${invite.household_id}`)
  return { success: true }
}

/**
 * Call this after login/signup to convert any pending invites into memberships.
 * Uses the process_pending_invites() SECURITY DEFINER function in Postgres.
 */
export async function processInvites() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { processed: 0 }

  const { data, error } = await supabase
    .rpc('process_pending_invites', {
      user_email: user.email,
      user_uuid: user.id,
    })

  if (error) return { processed: 0 }
  return { processed: data as number }
}

export async function updateMemberPermission(input: UpdateMemberPermissionInput) {
  const supabase = await createClient()

  // Look up which household this member belongs to, then verify ownership
  const { data: memberRow } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('id', input.member_id)
    .single()

  if (!memberRow) return { error: 'Member not found' }

  const { error: ownerError } = await requireHouseholdOwner(memberRow.household_id)
  if (ownerError) return { error: ownerError }

  const { data, error } = await supabase
    .from('household_members')
    .update({ permission: input.permission })
    .eq('id', input.member_id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/households/${data.household_id}`)
  return { data }
}

export async function removeMemberFromHousehold(memberId: string) {
  const supabase = await createClient()

  // Get member info and verify ownership
  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('id', memberId)
    .single()

  if (!member) return { error: 'Member not found' }

  const { error: ownerError } = await requireHouseholdOwner(member.household_id)
  if (ownerError) return { error: ownerError }

  const { error } = await supabase.from('household_members').delete().eq('id', memberId)

  if (error) return { error: 'Failed to remove member' }

  if (member) {
    revalidatePath(`/dashboard/households/${member.household_id}`)
  }
  revalidatePath('/dashboard')

  return { success: true }
}

export async function leaveHousehold(householdId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
