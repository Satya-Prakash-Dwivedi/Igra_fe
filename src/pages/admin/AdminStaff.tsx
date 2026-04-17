import React, { useState, useEffect } from 'react'
import { UserPlus, Shield, Trash2, Search } from 'lucide-react'
import adminService from '../../services/adminService'
import type { AdminUser } from '../../services/adminService'
import { serializeError, createLogger } from '../../services/logger'

const logger = createLogger('AdminStaff')

const AdminStaff: React.FC = () => {
  const [staff, setStaff] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add Staff Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [assignUserId, setAssignUserId] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)

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
      setError(err.response?.data?.message || 'Failed to load staff')
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
    } catch (err: any) {
      logger.error('failed_to_assign_staff', { err: serializeError(err) })
      alert(err.response?.data?.message || 'Failed to assign staff')
    } finally {
      setAssignLoading(false)
    }
  }

  const handleRemoveStaff = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return
    try {
      await adminService.removeStaff(userId)
      fetchStaff()
    } catch (err: any) {
      logger.error('failed_to_remove_staff', { err: serializeError(err) })
      alert(err.response?.data?.message || 'Failed to remove staff')
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Staff & Editors</h1>
          <p className="text-text-muted text-sm mt-1">Manage team members and roles</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg"
        >
          <UserPlus size={16} />
          Add Editor
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-error/10 border border-error/20 text-error p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="text-text-muted col-span-full">Loading staff...</div>
        ) : staff.length === 0 ? (
          <div className="text-text-muted col-span-full">No staff found.</div>
        ) : (
          staff.map(member => (
            <div key={member._id} className="bg-bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col items-center text-center group">
              <div className="relative mb-4">
                <img 
                  src={member.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                  alt="avatar" 
                  className="w-20 h-20 rounded-full border-2 border-primary/20 object-cover shadow-inner"
                />
                <div className="absolute -bottom-1 -right-1 bg-bg-dark border border-border rounded-full p-1.5 shadow-md">
                  {member.role === 'admin' ? (
                    <Shield size={14} className="text-primary" />
                  ) : (
                    <Shield size={14} className="text-text-muted" />
                  )}
                </div>
              </div>
              <h3 className="text-text-main font-semibold mb-1">{member.name}</h3>
              <p className="text-text-muted text-xs mb-4 truncate w-full">{member.email}</p>
              
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-bg-dark border border-border text-text-main mb-6">
                {member.role}
              </div>

              {member.role !== 'admin' && (
                <button
                  onClick={() => handleRemoveStaff(member._id)}
                  className="mt-auto flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium text-error border border-error/20 hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                  Remove Staff
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-main">Add New Editor</h2>
              <button onClick={() => setShowAddModal(false)} className="text-text-muted hover:text-text-main transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSearchUsers} className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="text" 
                  placeholder="Search user by email or name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-bg-dark border border-border rounded-lg text-sm text-text-main focus:border-primary/50 outline-none transition-colors"
                />
                <button type="submit" className="hidden">Search</button>
              </form>

              {searchLoading ? (
                <div className="text-center text-text-muted text-sm py-4">Searching...</div>
              ) : (
                <div className="space-y-3">
                  {searchResults.length === 0 && searchQuery ? (
                    <div className="text-center text-text-muted text-sm py-4">Hit enter to search</div>
                  ) : (
                    searchResults.map(u => (
                      <div key={u._id} className="flex items-center justify-between p-3 bg-bg-dark border border-border rounded-lg shadow-inner">
                        <div className="flex items-center gap-3">
                           <img src={u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-8 h-8 rounded-full object-cover" />
                           <div className="min-w-0">
                             <p className="text-sm font-medium text-text-main truncate max-w-[150px]">{u.name}</p>
                             <p className="text-xs text-text-muted truncate max-w-[150px]">{u.email}</p>
                           </div>
                        </div>
                        <button
                          disabled={assignLoading}
                          onClick={() => handleAssignStaff(u._id)}
                          className="text-xs font-semibold bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shadow-md"
                        >
                          Make Editor
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminStaff
