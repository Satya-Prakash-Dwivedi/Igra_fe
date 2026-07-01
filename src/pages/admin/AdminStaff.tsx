import React, { useState, useEffect } from 'react'
import {
  UserPlus,
  Shield,
  Trash2,
  Search,
  Users,
  ShieldCheck,
  Mail,
  X,
  ShieldAlert,
  Zap,
  Settings,
} from 'lucide-react'
import adminService from '../../services/adminService'
import type { AdminUser } from '../../services/adminService'
import { serializeError, createLogger } from '../../services/logger'
import { toast } from 'sonner'
import Button, { cn } from '../../components/Button'

import { resolveApiUrl } from '../../utils/urlUtils'

const logger = createLogger('AdminStaff')

const AdminStaff: React.FC = () => {
  const [staff, setStaff] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add Staff Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)

  // Revoke Staff Modal State
  const [userToRevoke, setUserToRevoke] = useState<AdminUser | null>(null)

  // Wait, searching users to add them
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const data = await adminService.listStaff()
      setStaff(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sync staff records')
      logger.error('failed_to_load_staff', { err: serializeError(err) })
    } finally {
      setLoading(false)
    }
  }

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery) return
    try {
      setSearchLoading(true)
      const data = await adminService.listUsers({ search: searchQuery, limit: 5 })
      setSearchResults(data.users)
    } catch (err) {
      logger.error('failed_to_search_users', { err: serializeError(err) })
    } finally {
      setSearchLoading(false)
    }
  }

  const handleAssignStaff = async (userId: string) => {
    try {
      setAssignLoading(true)
      await adminService.assignStaff(userId)
      setShowAddModal(false)
      setSearchQuery('')
      setSearchResults([])
      fetchStaff()
      toast.success('New editor established')
    } catch (err: any) {
      logger.error('failed_to_assign_staff', { err: serializeError(err) })
      toast.error(err.response?.data?.message || 'Failed to assign staff')
    } finally {
      setAssignLoading(false)
    }
  }

  const handleRemoveStaff = async (userId: string) => {
    try {
      await adminService.removeStaff(userId)
      fetchStaff()
      setUserToRevoke(null)
      toast.success('Staff access revoked')
    } catch (err: any) {
      logger.error('failed_to_remove_staff', { err: serializeError(err) })
      toast.error(err.response?.data?.message || 'Failed to remove staff')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Settings size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Staff Settings</h1>
            </div>
          </div>
          <div className="mt-2 text-text-muted text-sm font-medium">
            <p>Manage your internal production team and permissions.</p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg shadow-sm"
        >
          <UserPlus size={18} />
          Add Editor
        </Button>
      </div>

      {error && (
        <div className="bg-error/5 border border-error/20 text-error p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <ShieldAlert size={20} />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 col-span-full gap-4">
            <div className="relative">
              <div className="w-10 h-10 border-2 border-primary/20 rounded-full" />
              <div className="absolute inset-0 w-10 h-10 border-t-2 border-primary rounded-full animate-spin" />
            </div>
            <p className="text-sm font-medium text-text-muted">Syncing team records...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 col-span-full gap-4 bg-bg-card border border-dashed border-white/10 rounded-xl">
            <Users size={40} className="text-text-muted/50" />
            <p className="text-lg font-semibold text-text-muted">
              No active production staff found
            </p>
          </div>
        ) : (
          staff.map((member) => (
            <div
              key={member._id}
              className="bg-bg-card border border-white/10 rounded-xl p-6 shadow-sm flex flex-col items-center text-center group transition-colors hover:border-white/20 hover:bg-white/[0.02]"
            >
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-primary/50 transition-colors">
                  <img
                    src={
                      resolveApiUrl(member.avatar) ||
                      'https://cdn-icons-png.flaticon.com/512/149/149071.png'
                    }
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-bg-dark border border-white/10 rounded-lg p-1.5 shadow-sm">
                  {member.role === 'admin' ? (
                    <ShieldCheck size={16} className="text-primary" />
                  ) : (
                    <Shield size={16} className="text-emerald-500" />
                  )}
                </div>
              </div>

              <div className="space-y-1 mb-5 w-full">
                <h3 className="text-white font-semibold text-lg truncate px-2">{member.name}</h3>
                <div className="flex items-center justify-center gap-1.5 text-text-muted">
                  <Mail size={12} />
                  <p className="text-xs font-medium truncate max-w-[200px]">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-center mb-8">
                <div
                  className={cn(
                    'px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider',
                    member.role === 'admin'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-emerald-500/10 text-emerald-500'
                  )}
                >
                  {member.role}
                </div>
              </div>

              <div className="flex flex-col w-full mt-auto">
                <Button
                  variant="outline"
                  onClick={() => setUserToRevoke(member)}
                  className="w-full text-error border-error/20 hover:bg-error/10 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Revoke Access
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />

          <div className="bg-bg-card w-full max-w-lg rounded-xl shadow-xl border border-white/10 overflow-hidden relative z-10">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-white">Add Staff Member</h2>
                <p className="text-text-muted text-sm">
                  Grant production privileges to an existing user.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <form onSubmit={handleSearchUsers} className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Identify user by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white text-sm placeholder:text-text-muted/60 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button type="submit" className="hidden">
                  Search
                </button>
              </form>

              <div className="space-y-3">
                {searchLoading ? (
                  <div className="flex flex-col items-center py-8 gap-3">
                    <Loader2 size={24} className="animate-spin text-primary" />
                    <p className="text-sm text-text-muted">Scanning records...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  searchQuery && (
                    <div className="py-8 text-center text-text-muted">
                      <p className="text-sm">No matching records found</p>
                    </div>
                  )
                ) : (
                  searchResults.map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={
                            resolveApiUrl(u.avatar) ||
                            'https://cdn-icons-png.flaticon.com/512/149/149071.png'
                          }
                          className="w-10 h-10 rounded-lg object-cover border border-white/10"
                        />
                        <div className="min-w-0 pr-4">
                          <p className="text-white font-semibold text-sm truncate">{u.name}</p>
                          <p className="text-xs text-text-muted truncate">{u.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        disabled={assignLoading}
                        onClick={() => handleAssignStaff(u._id)}
                        className="px-4 py-1.5 text-sm flex items-center gap-1.5 shrink-0"
                      >
                        <Zap size={14} />
                        Grant
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {userToRevoke && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setUserToRevoke(null)}
          />
          <div className="bg-bg-card w-full max-w-sm rounded-xl shadow-xl border border-white/10 overflow-hidden relative z-10 p-6 text-center space-y-6">
            <div className="w-12 h-12 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Revoke Access?</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                Are you sure you want to revoke production staff access for{' '}
                <span className="text-white font-semibold">{userToRevoke.name}</span>? They will
                lose all administrative privileges immediately.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setUserToRevoke(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-error hover:bg-error/90"
                onClick={() => handleRemoveStaff(userToRevoke._id)}
              >
                Revoke
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Loader2 = ({ size, className }: { size: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
)

export default AdminStaff
