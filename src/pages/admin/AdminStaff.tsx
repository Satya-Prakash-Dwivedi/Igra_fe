import React, { useState, useEffect } from 'react'
import { UserPlus, Shield, Trash2, Search, Users, ShieldCheck, Mail, X, ShieldAlert, Zap } from 'lucide-react'
import adminService from '../../services/adminService'
import type { AdminUser } from '../../services/adminService'
import { serializeError, createLogger } from '../../services/logger'
import { toast } from 'sonner'
import Button, { cn } from '../../components/Button'

const logger = createLogger('AdminStaff')

const AdminStaff: React.FC = () => {
  const [staff, setStaff] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add Staff Modal State
  const [showAddModal, setShowAddModal] = useState(false)
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
    if (!confirm('Are you sure you want to revoke staff access?')) return
    try {
      await adminService.removeStaff(userId)
      fetchStaff()
      toast.success('Staff access revoked')
    } catch (err: any) {
      logger.error('failed_to_remove_staff', { err: serializeError(err) })
      toast.error(err.response?.data?.message || 'Failed to remove staff')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 p-6 md:p-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-white font-bold text-4xl tracking-tight">Studio <span className="text-primary italic">personnel</span></h1>
          <p className="text-text-dim text-lg font-medium opacity-60">Manage your internal production team and permissions.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl shadow-xl shadow-primary/20"
        >
          <UserPlus size={20} />
          Add editor
        </Button>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error p-6 rounded-[2rem] flex items-center gap-4 animate-in shake duration-300 shadow-2xl">
          <ShieldAlert size={24} />
          <p className="font-bold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 col-span-full gap-6">
             <div className="relative">
                <div className="w-16 h-16 border-2 border-primary/20 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-t-2 border-primary rounded-full animate-spin" />
             </div>
             <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-dim/40 animate-pulse">Syncing team records...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 col-span-full gap-6 bg-bg-card/40 border border-dashed border-white/5 rounded-[3rem] opacity-40">
             <Users size={48} className="text-text-dim/20" />
             <p className="text-xl font-bold italic">No active production staff found</p>
          </div>
        ) : (
          staff.map((member, i) => (
            <div key={member._id} className="bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center text-center group transition-all duration-500 hover:border-primary/40 hover:scale-[1.02] animate-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-2xl group-hover:scale-105 group-hover:border-primary transition-all duration-500">
                   <img 
                     src={member.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                     alt="avatar" 
                     className="w-full h-full object-cover"
                   />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-bg-dark border border-white/10 rounded-xl p-2 shadow-xl group-hover:rotate-12 transition-transform duration-500">
                  {member.role === 'admin' ? (
                    <ShieldCheck size={18} className="text-primary" />
                  ) : (
                    <Shield size={18} className="text-success" />
                  )}
                </div>
              </div>
              
              <div className="space-y-1 mb-6 w-full">
                <h3 className="text-white font-bold text-xl tracking-tight group-hover:text-primary transition-colors">{member.name}</h3>
                <div className="flex items-center justify-center gap-2 text-text-dim/40">
                   <Mail size={12} />
                   <p className="text-xs font-medium truncate max-w-[200px]">{member.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-10">
                 <div className={cn(
                    "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all duration-500",
                    member.role === 'admin' 
                      ? "bg-primary/10 border-primary/20 text-primary shadow-[0_0_20px_rgba(225,29,72,0.1)]" 
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                 )}>
                   {member.role}
                 </div>
                 <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              </div>

              <div className="flex flex-col w-full gap-3 mt-auto pt-6">
                <button
                  onClick={() => handleRemoveStaff(member._id)}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-error border border-error/10 hover:bg-error hover:text-white transition-all duration-500 opacity-0 group-hover:opacity-100 shadow-xl shadow-error/5"
                >
                  <Trash2 size={14} />
                  Revoke access
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-500" onClick={() => setShowAddModal(false)} />
          
          <div className="bg-bg-card/60 backdrop-blur-3xl w-full max-w-lg rounded-[3rem] shadow-[0_50px_200px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden relative z-10 animate-in zoom-in-95 duration-500">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="space-y-1">
                 <h2 className="text-2xl font-bold text-white tracking-tight">Onboard personnel</h2>
                 <p className="text-text-dim text-xs font-medium opacity-60">Grant production privileges to an existing user.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-text-dim hover:text-white hover:bg-white/10 transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-10 space-y-8">
              <form onSubmit={handleSearchUsers} className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim/40 group-focus-within:text-primary transition-all duration-300" size={20} />
                <input 
                  type="text" 
                  placeholder="Identify user by email or name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-black/20 border border-white/5 rounded-2xl text-white placeholder:text-text-dim/20 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all shadow-inner font-medium"
                />
                <button type="submit" className="hidden">Search</button>
              </form>

              <div className="space-y-4">
                {searchLoading ? (
                  <div className="flex flex-col items-center py-10 gap-4 opacity-40">
                     <Loader2 size={32} className="animate-spin text-primary" />
                     <p className="text-xs font-bold uppercase tracking-widest">Scanning records...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  searchQuery && (
                    <div className="py-10 text-center opacity-20">
                       <p className="text-sm font-bold italic">No matching records found</p>
                    </div>
                  )
                ) : (
                  searchResults.map(u => (
                    <div key={u._id} className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[1.5rem] group hover:border-primary/40 transition-all duration-500 shadow-xl">
                      <div className="flex items-center gap-4">
                         <img src={u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-lg" />
                         <div className="min-w-0">
                           <p className="text-white font-bold tracking-tight truncate max-w-[150px]">{u.name}</p>
                           <p className="text-xs text-text-dim/60 font-medium truncate max-w-[150px]">{u.email}</p>
                         </div>
                      </div>
                      <Button
                        disabled={assignLoading}
                        onClick={() => handleAssignStaff(u._id)}
                        className="px-6 rounded-xl shadow-lg shadow-primary/10 flex items-center gap-2 group-hover:scale-105"
                      >
                        <Zap size={14} />
                        Grant access
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Loader2 = ({ size, className }: { size: number, className?: string }) => (
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
);

export default AdminStaff
