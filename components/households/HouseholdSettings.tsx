'use client'

import { useState } from 'react'
import type { HouseholdWithMembers, Permission, Currency } from '@/types/database'

type PendingInvite = {
  id: string
  invited_email: string
  permission: Permission
  created_at: string
}
import {
  updateHousehold,
  deleteHousehold,
  addMemberToHousehold,
  removeMemberFromHousehold,
  updateMemberPermission,
  leaveHousehold,
  cancelInvite,
} from '@/app/actions/households'
import { useRouter } from 'next/navigation'
import { CURRENCIES } from '@/lib/currency'

export default function HouseholdSettings({
  household,
  currentUserId,
  pendingInvites = [],
}: {
  household: HouseholdWithMembers
  currentUserId: string
  pendingInvites?: PendingInvite[]
}) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [householdName, setHouseholdName] = useState(household.name)
  const [currency, setCurrency] = useState<Currency>(household.currency)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePermission, setInvitePermission] = useState<Permission>('read')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isCreator = household.created_by === currentUserId
  const currentMember = household.members.find((m) => m.user_id === currentUserId)
  const canManage = isCreator || currentMember?.permission === 'write'

  async function handleUpdateName() {
    setLoading(true)
    setError(null)

    const result = await updateHousehold({
      id: household.id,
      name: householdName,
      currency,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Household settings updated!')
      setIsEditing(false)
      setTimeout(() => setSuccess(null), 3000)
    }
    setLoading(false)
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await addMemberToHousehold({
      household_id: household.id,
      user_email: inviteEmail,
      permission: invitePermission,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Invite sent!')
      setInviteEmail('')
      setTimeout(() => setSuccess(null), 3000)
    }
    setLoading(false)
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return

    setLoading(true)
    const result = await removeMemberFromHousehold(memberId)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Member removed successfully!')
      setTimeout(() => setSuccess(null), 3000)
    }
    setLoading(false)
  }

  async function handleUpdatePermission(memberId: string, permission: Permission) {
    setLoading(true)
    const result = await updateMemberPermission({ member_id: memberId, permission })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Permission updated!')
      setTimeout(() => setSuccess(null), 3000)
    }
    setLoading(false)
  }

  async function handleCancelInvite(inviteId: string) {
    setLoading(true)
    const result = await cancelInvite(inviteId)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Invite cancelled.')
      setTimeout(() => setSuccess(null), 3000)
    }
    setLoading(false)
  }

  async function handleLeave() {
    if (!confirm('Are you sure you want to leave this household?')) return

    setLoading(true)
    const result = await leaveHousehold(household.id)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        'Are you sure you want to delete this household? This action cannot be undone.'
      )
    )
      return

    setLoading(true)
    const result = await deleteHousehold(household.id)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    className="text-2xl font-bold border-b-2 border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Currency:</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.symbol} - {curr.name} ({curr.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateName}
                    disabled={loading || !householdName.trim()}
                    className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setHouseholdName(household.name)
                      setCurrency(household.currency)
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 px-4 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{household.name}</h1>
                  {canManage && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-gray-600">
                    {household.members.length} member{household.members.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-gray-600">
                    Currency: {CURRENCIES.find(c => c.code === household.currency)?.symbol} {household.currency}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {!isCreator && (
              <button
                onClick={handleLeave}
                disabled={loading}
                className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Leave Household
              </button>
            )}
            {isCreator && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Delete Household
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            {success}
          </div>
        )}
      </div>

      {/* Add Member */}
      {canManage && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Invite Member</h2>
          <form onSubmit={handleAddMember} className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
              required
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={invitePermission}
              onChange={(e) => setInvitePermission(e.target.value as Permission)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="read">Read Only</option>
              <option value="write">Can Edit</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Invite
            </button>
          </form>
        </div>
      )}

      {/* Pending Invites */}
      {isCreator && pendingInvites.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Pending Invites</h2>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 border border-yellow-200 bg-yellow-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800">{invite.invited_email}</p>
                  <p className="text-sm text-gray-500">
                    {invite.permission === 'write' ? 'Can Edit' : 'Read Only'} · Awaiting signup
                  </p>
                </div>
                <button
                  onClick={() => handleCancelInvite(invite.id)}
                  disabled={loading}
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 px-3 py-1 border border-red-300 rounded hover:bg-red-50"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Members</h2>
        <div className="space-y-3">
          {household.members.map((member) => {
            const isCurrentUser = member.user_id === currentUserId
            const isMemberCreator = member.user_id === household.created_by

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {member.user.user_metadata?.full_name || member.user.email}
                    {isCurrentUser && (
                      <span className="ml-2 text-sm text-gray-500">(You)</span>
                    )}
                    {isMemberCreator && (
                      <span className="ml-2 text-sm text-blue-600">(Creator)</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">{member.user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {canManage && !isMemberCreator ? (
                    <select
                      value={member.permission}
                      onChange={(e) =>
                        handleUpdatePermission(member.id, e.target.value as Permission)
                      }
                      disabled={loading}
                      className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="read">Read Only</option>
                      <option value="write">Can Edit</option>
                    </select>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded text-sm ${
                        member.permission === 'write'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {member.permission === 'write' ? 'Can Edit' : 'Read Only'}
                    </span>
                  )}
                  {canManage && !isCurrentUser && !isMemberCreator && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
