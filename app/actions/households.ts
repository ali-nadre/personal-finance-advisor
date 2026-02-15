'use server'

import { createClient } from '@/lib/supabase/server'
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

  const { data, error } = await supabase
    .from('households')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
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

  // Get members with user details
  const { data: members, error: membersError } = await supabase
    .from('household_members')
    .select(
      `
      *,
      user:user_id (
        email,
        user_metadata
      )
    `
    )
    .eq('household_id', householdId)

  if (membersError) {
    return { error: membersError.message }
  }

  return {
    data: {
      ...household,
      members: members || [],
    } as HouseholdWithMembers,
  }
}

export async function updateHousehold(input: UpdateHouseholdInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('households')
    .update({ name: input.name })
    .eq('id', input.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/households/${input.id}`)
  return { data }
}

export async function deleteHousehold(householdId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.from('households').delete().eq('id', householdId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function addMemberToHousehold(input: AddMemberInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Find user by email
  const { data: invitedUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', input.user_email)
    .single()

  if (userError || !invitedUser) {
    return { error: 'User not found with that email' }
  }

  // Add member
  const { data, error } = await supabase
    .from('household_members')
    .insert({
      household_id: input.household_id,
      user_id: invitedUser.id,
      permission: input.permission,
      invited_by: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'User is already a member of this household' }
    }
    return { error: error.message }
  }

  revalidatePath(`/dashboard/households/${input.household_id}`)
  return { data }
}

export async function updateMemberPermission(input: UpdateMemberPermissionInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get member info to revalidate the correct path
  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('id', memberId)
    .single()

  const { error } = await supabase.from('household_members').delete().eq('id', memberId)

  if (error) {
    return { error: error.message }
  }

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
