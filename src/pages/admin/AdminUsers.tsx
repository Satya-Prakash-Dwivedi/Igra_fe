import React, { useState, useEffect } from 'react'
import { Search, User as UserIcon, Calendar, Hash, ArrowRight, Loader2, ShieldCheck, Mail, ShieldAlert, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import adminService from '../../services/adminService'
import type { AdminUser } from '../../services/adminService'
import { serializeError, createLogger } from '../../services/logger'
import Button, { cn } from '../../components/Button'

const logger = createLogger('AdminUsers')

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    fetchUsers()
  }, [page])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await adminService.listUsers({ page, limit: 20, search })
      setUsers(data.users)
      setTotalPages(data.totalPages)
      setTotalUsers(data.total)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sync client records')
      logger.error('failed_to_load_users', { err: serializeError(err) })
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    if (avatar.startsWith('http')) return avatar;
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${baseUrl}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 p-8 md:p-14 animate-in fade-in duration-1000 relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 relative z-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-primary shadow-2xl">
                <Users size={24} />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Studio <span className="text-primary italic">Identities</span></h1>
                <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] mt-1 opacity-40">Client Oversight Module</p>
             </div>
          </div>
          <p className="text-text-dim text-sm font-medium max-w-xl leading-relaxed">
            Managing <span className="text-white font-bold">{totalUsers}</span> registered profiles across the global studio network.
          </p>
        </div>
        
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-[400px] group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted/20 group-focus-within:text-primary transition-all duration-300" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4.5 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-2xl text-sm font-bold text-white placeholder:text-text-muted/10 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all shadow-2xl"
          />
        </form>
      </div>

      {error && (
        <div className="bg-error/5 border border-error/10 text-error px-8 py-5 rounded-2xl flex items-center gap-4 animate-in shake duration-500 shadow-lg">
          <ShieldAlert size={20} className="animate-pulse" />
          <p className="font-bold text-xs uppercase tracking-widest">{error}</p>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-bg-card/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-12 duration-1000 relative z-10">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01] border-b border-white/5">
                <th className="px-10 py-8 text-[11px] font-black text-text-muted/30 uppercase tracking-[0.3em]"><div className="flex items-center gap-3">Client Profile</div></th>
                <th className="px-10 py-8 text-[11px] font-black text-text-muted/30 uppercase tracking-[0.3em]">Contact Verification</th>
                <th className="px-10 py-8 text-[11px] font-black text-text-muted/30 uppercase tracking-[0.3em] text-center">Registration</th>
                <th className="px-10 py-8 text-[11px] font-black text-text-muted/30 uppercase tracking-[0.3em] text-right">Activity</th>
                <th className="px-10 py-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-56 text-center">
                    <div className="flex flex-col items-center gap-8">
                       <div className="relative">
                          <div className="w-20 h-20 border border-primary/10 rounded-full" />
                          <div className="absolute inset-0 w-20 h-20 border-t border-primary rounded-full animate-spin" />
                          <div className="absolute inset-4 border border-white/5 rounded-full animate-pulse" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse">Syncing Identitites</p>
                          <p className="text-[8px] font-bold text-text-muted/20 uppercase tracking-[0.2em]">Oversight connection pending...</p>
                       </div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-40 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                       <Users size={48} className="text-text-muted" />
                       <p className="text-xl font-black italic tracking-tight">No entities cataloged</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user: AdminUser) => (
                  <tr key={user._id} className="hover:bg-white/[0.01] transition-all duration-500 group">
                    <td className="px-10 py-7">
                      <Link to={`/admin/users/${user._id}`} className="flex items-center gap-5 outline-none group/avatar">
                        <div className="relative flex-shrink-0">
                           <img 
                             src={getAvatarUrl(user.avatar)} 
                             alt="avatar" 
                             className="w-14 h-14 rounded-2xl border border-white/5 object-cover shadow-2xl transition-all duration-500 group-hover/avatar:border-primary/40 group-hover/avatar:scale-105 transform-gpu"
                           />
                           {user.role === 'admin' && (
                             <div className="absolute -top-2 -right-2 bg-primary p-1.5 rounded-lg shadow-xl border border-white/10">
                                <ShieldCheck size={12} className="text-white" />
                             </div>
                           )}
                           <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 group-hover:ring-primary/20 transition-all" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-white tracking-tight group-hover:text-primary transition-colors truncate">{user.name}</span>
                          <div className="flex items-center gap-2 mt-1.5">
                            {user.role === 'admin' && (
                              <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/5">Administrator</span>
                            )}
                            {user.role === 'staff' && (
                              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/5">Studio Staff</span>
                            )}
                            {user.role === 'user' && (
                              <span className="px-2.5 py-0.5 bg-white/5 text-text-muted border border-white/5 rounded-md text-[9px] font-black uppercase tracking-widest">Client</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-10 py-7">
                       <div className="flex flex-col gap-1">
                          <p className="text-text-muted text-[13px] font-medium tracking-tight group-hover:text-white transition-colors truncate max-w-[200px]">{user.email}</p>
                          <div className="flex items-center gap-2 opacity-40">
                             <div className="w-1 h-1 rounded-full bg-emerald-500" />
                             <span className="text-[8px] font-bold uppercase tracking-widest">Channel Verified</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-7 text-center">
                       <div className="flex flex-col items-center">
                          <span className="text-white font-bold font-mono text-[10px] opacity-60">
                            {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-[8px] font-black text-text-muted/20 uppercase tracking-widest mt-1">Audit Record</span>
                       </div>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex flex-col items-end group/stat">
                         <span className="text-2xl font-black text-white font-mono tracking-tighter group-hover/stat:text-primary transition-colors">{user.totalOrders || 0}</span>
                         <span className="text-[10px] font-black text-text-muted/20 uppercase tracking-[0.2em]">Oversight Units</span>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-right">
                       <Link to={`/admin/users/${user._id}`}>
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-text-muted/20 group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:shadow-lg group-hover:shadow-primary/5 transition-all duration-300 shadow-inner group-hover:-translate-x-1">
                            <ArrowRight size={20} />
                          </div>
                       </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-12 pt-8 relative z-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p: number) => p - 1)}
            className="group flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.3em] text-text-muted hover:text-white disabled:opacity-10 transition-all"
          >
            <div className="w-10 h-10 rounded-xl border border-white/5 flex items-center justify-center group-hover:bg-white/5 transition-all">
               <ArrowRight className="rotate-180" size={14} />
            </div>
            Prev
          </button>
          
          <div className="flex flex-col items-center">
             <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white tracking-tighter">{page}</span>
                <span className="text-text-muted/20 text-xs font-bold uppercase tracking-widest">of</span>
                <span className="text-xl font-black text-text-muted/40 tracking-tighter">{totalPages}</span>
             </div>
             <div className="h-0.5 w-12 bg-primary/20 rounded-full mt-2" />
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p: number) => p + 1)}
            className="group flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.3em] text-text-muted hover:text-white disabled:opacity-10 transition-all"
          >
            Next
            <div className="w-10 h-10 rounded-xl border border-white/5 flex items-center justify-center group-hover:bg-white/5 transition-all">
               <ArrowRight size={14} />
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
