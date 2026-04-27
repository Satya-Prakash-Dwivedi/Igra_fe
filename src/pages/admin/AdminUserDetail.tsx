import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Package, Ticket, ShieldAlert, User as UserIcon, Calendar, Building, Shield, ExternalLink, Database, Activity, Mail, ShieldCheck } from 'lucide-react'
import adminService from '../../services/adminService'
import { createLogger, serializeError } from '../../services/logger'
import Button, { cn } from '../../components/Button'
import ConfirmModal from '../../components/modals/ConfirmModal'

import { resolveApiUrl } from '../../utils/urlUtils'

const logger = createLogger('AdminUserDetail')

const AdminUserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    icon?: any;
    variant?: 'primary' | 'error' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  useEffect(() => {
    if (id) fetchUserDetail()
  }, [id])

  const fetchUserDetail = async () => {
    try {
      setLoading(true)
      const res = await adminService.getUserDetail(id!)
      setData(res)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to establish connection with user profile.')
      logger.error('failed_to_load_user_detail', { err: serializeError(err) })
    } finally {
      setLoading(false)
    }
  }


  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 animate-in fade-in duration-1000">
      <div className="relative">
         <div className="w-20 h-20 border border-primary/20 rounded-full" />
         <div className="absolute inset-0 w-20 h-20 border-t-2 border-primary rounded-full animate-spin" />
         <div className="absolute inset-4 border border-white/5 rounded-full animate-pulse" />
      </div>
      <div className="text-center space-y-1">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse">Decrypting Identity Dossier</p>
         <p className="text-[8px] font-bold text-text-muted/20 uppercase tracking-[0.2em]">Establishing secure oversight link...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="p-12 max-w-4xl mx-auto">
      <div className="bg-error/5 border border-error/10 rounded-[2.5rem] p-12 flex flex-col items-center text-center gap-6 shadow-2xl animate-in shake duration-500">
        <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center text-error shadow-xl shadow-error/10">
           <ShieldAlert size={32} />
        </div>
        <div className="space-y-2">
           <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Access <span className="text-error not-italic">Failed</span></h2>
           <p className="text-sm font-medium text-text-muted opacity-60 max-w-md mx-auto">{error}</p>
        </div>
        <Button variant="outline" className="rounded-xl px-10 border-white/10 bg-white/5" onClick={() => window.location.reload()}>
           Retry Connection
        </Button>
      </div>
    </div>
  )

  if (!data) return (
    <div className="p-12 flex flex-col items-center justify-center opacity-20 italic font-black text-3xl animate-in zoom-in-95 duration-700">
       No Identity Record Cataloged
    </div>
  )

  const { user, orders, tickets, bugs } = data

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-14 space-y-16 animate-in fade-in duration-1000 relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] -ml-64 -mb-64 pointer-events-none" />

      <Link to="/admin/users" className="group inline-flex items-center gap-4 text-text-muted/40 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
          <ArrowLeft size={18} />
        </div>
        Return to oversight
      </Link>

      {/* Identity Dossier Header */}
      <div className="bg-bg-card/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden group z-10">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-16 relative z-10">
          <div className="relative flex-shrink-0 group/avatar">
             <img 
               src={user.avatar ? resolveApiUrl(user.avatar) : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
               alt="avatar" 
               className="w-32 h-32 rounded-[2rem] border border-white/10 object-cover shadow-2xl transition-all duration-700 group-hover/avatar:scale-105 group-hover/avatar:border-primary/40 transform-gpu"
             />
             <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 rotate-12 group-hover/avatar:rotate-0 transition-all duration-500 border-4 border-bg-dark">
                <ShieldCheck size={20} className="text-white" />
             </div>
             <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/10 group-hover/avatar:ring-primary/20 transition-all" />
          </div>
          
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="space-y-3">
               <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-5 justify-center lg:justify-start">
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight italic">
                     {user.name.split(' ')[0]} <span className="text-primary not-italic">{user.name.split(' ').slice(1).join(' ')}</span>
                  </h1>
                  <div className="flex justify-center">
                    <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-bold text-primary uppercase tracking-[0.2em]">
                      Verified Identity
                    </span>
                  </div>
               </div>
               <div className="flex items-center justify-center lg:justify-start gap-2.5 text-text-muted/40">
                  <Mail size={12} className="text-primary/40" />
                  <p className="text-sm font-medium tracking-tight">{user.email}</p>
               </div>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/5 shadow-xl hover:bg-white/[0.04] transition-all duration-300">
                <div className="flex items-center gap-2 text-text-muted/20 mb-1.5">
                   <Calendar size={10} className="text-primary/40" />
                   <p className="text-[8px] font-bold uppercase tracking-[0.2em]">Enrolled</p>
                </div>
                <p className="text-sm font-bold text-white font-mono">
                  {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              
              <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/5 shadow-xl hover:bg-white/[0.04] transition-all duration-300">
                <div className="flex items-center gap-2 text-text-muted/20 mb-1.5">
                   <Shield size={10} className="text-emerald-500/40" />
                   <p className="text-[8px] font-bold uppercase tracking-[0.2em]">Privilege</p>
                </div>
                <p className="text-sm font-bold text-primary uppercase tracking-[0.2em] italic">{user.role}</p>
              </div>
              
              {user.companyName && (
                <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/5 shadow-xl hover:bg-white/[0.04] transition-all duration-300">
                  <div className="flex items-center gap-2 text-text-muted/20 mb-1.5">
                     <Building size={10} className="text-blue-500/40" />
                     <p className="text-[8px] font-bold uppercase tracking-[0.2em]">Affiliation</p>
                  </div>
                  <p className="text-sm font-bold text-white truncate max-w-[150px]">{user.companyName}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-3 w-full lg:w-48">
             <Button 
                variant="primary" 
                className="rounded-xl px-6 py-3 shadow-xl shadow-primary/10 flex items-center justify-center gap-2.5 transition-all hover:scale-105"
                onClick={() => window.open(`mailto:${user.email}`)}
             >
                <Mail size={16} /> 
                <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Secure Dispatch</span>
             </Button>
             
             {user.role === 'user' ? (
                <Button 
                   variant="outline" 
                   className="rounded-xl px-6 py-3 border-white/5 bg-white/5 text-text-muted/60 hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest"
                   onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Elevate Identity',
                        message: `Are you sure you want to elevate ${user.name} to Staff status? This will grant them administrative access to studio operations.`,
                        icon: ShieldCheck,
                        variant: 'primary',
                        onConfirm: async () => {
                           try {
                              await adminService.assignStaff(user._id);
                              window.location.reload();
                           } catch (err) {
                              alert('Elevation failed');
                           }
                        }
                      });
                   }}
                >
                   Elevate to Staff
                </Button>
             ) : (
                <Button 
                   variant="outline" 
                   className="rounded-xl px-6 py-3 border-error/10 bg-error/5 text-error/60 hover:bg-error hover:text-white text-[10px] font-bold uppercase tracking-widest"
                   onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Revoke Privilege',
                        message: `Are you sure you want to revoke Staff status for ${user.name}? They will lose all administrative privileges.`,
                        icon: ShieldAlert,
                        variant: 'error',
                        onConfirm: async () => {
                           try {
                              await adminService.removeStaff(user._id);
                              window.location.reload();
                           } catch (err) {
                              alert('Revocation failed');
                           }
                        }
                      });
                   }}
                >
                   Revoke Staff
                </Button>
             )}
          </div>
        </div>
      </div>

      <ConfirmModal 
        {...confirmModal}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 relative z-10">
        {/* Production Queue Oversight */}
        <div className="lg:col-span-2 space-y-10">
          <div className="flex items-center justify-between px-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xl shadow-primary/5">
                   <Package size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-white tracking-tight uppercase italic">Production <span className="text-primary not-italic">Queue</span></h2>
                   <p className="text-[9px] font-bold text-text-muted/40 uppercase tracking-[0.3em]">Operational Oversight</p>
                </div>
             </div>
             <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em]">
                {orders.length} ACTIVE UNITS
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {orders.length === 0 ? (
               <div className="col-span-full py-28 bg-white/[0.01] border border-dashed border-white/10 rounded-[4rem] flex flex-col items-center justify-center gap-6 opacity-30">
                  <Database size={48} className="text-text-muted/40" />
                  <div className="text-center">
                     <p className="text-xl font-black italic tracking-tight text-white uppercase">No active operations</p>
                     <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Dossier indicates zero production history</p>
                  </div>
               </div>
             ) : (
               orders.map((o: any, i: number) => (
                 <Link key={o._id} to={`/admin/orders/${o._id}`} className="group relative bg-bg-card/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] hover:border-primary/40 transition-all duration-700 animate-in slide-in-from-bottom-8 transform-gpu" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex justify-between items-start mb-8">
                      <div className="space-y-1">
                        <span className="text-primary font-mono text-[11px] font-black uppercase tracking-[0.2em] block group-hover:tracking-[0.3em] transition-all">
                          #{o.orderNumber || o._id.substring(0, 8)}
                        </span>
                        <h3 className="text-white font-black text-xl tracking-tighter line-clamp-1 group-hover:text-primary transition-colors">{o.title}</h3>
                      </div>
                      <div className={cn(
                        "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-700 shadow-xl",
                        o.status === 'COMPLETED' 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10" 
                          : "bg-white/5 text-text-muted/30 border-white/5"
                      )}>
                        {o.status.replace('_', ' ')}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-white/[0.03]">
                       <div className="flex items-center gap-3 text-text-muted/40">
                          <Activity size={12} className="text-primary/40" />
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] font-mono">
                            {new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                       </div>
                       <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary group-hover:bg-primary/10 group-hover:rotate-12 transition-all duration-500">
                          <ExternalLink size={16} />
                       </div>
                    </div>
                 </Link>
               ))
             )}
          </div>
        </div>

        {/* Intelligence Feeds */}
        <div className="space-y-16">
          {/* Support Incidents */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 px-2">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-2xl shadow-primary/10">
                  <Ticket size={24} />
               </div>
               <div>
                  <h2 className="text-lg font-bold text-white tracking-tight uppercase italic">Incidents</h2>
                  <p className="text-[9px] font-bold text-text-muted/40 uppercase tracking-[0.3em]">Intelligence Feed</p>
               </div>
            </div>
            
            <div className="space-y-6">
               {tickets.length === 0 ? (
                 <div className="py-16 bg-white/[0.01] border border-white/5 rounded-[2.5rem] text-center opacity-20 italic text-sm font-bold uppercase tracking-widest">
                    No active incidents cataloged
                 </div>
               ) : (
                 tickets.map((t: any, i: number) => (
                   <div key={t._id} className="bg-bg-card/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-right-8 duration-1000 relative group overflow-hidden" style={{ animationDelay: `${i * 100}ms` }}>
                     <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                     <div className="flex justify-between items-center mb-5 relative z-10">
                        <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[9px] font-black text-primary uppercase tracking-[0.2em] shadow-lg shadow-primary/5">{t.category}</span>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg",
                          t.status === 'open' ? "text-emerald-500 bg-emerald-500/10" : "text-text-muted/20 bg-white/5"
                        )}>{t.status}</span>
                     </div>
                     <p className="text-text-muted text-[13px] font-medium leading-relaxed line-clamp-3 opacity-60 italic relative z-10 group-hover:opacity-100 transition-opacity duration-500">"{t.message}"</p>
                   </div>
                 ))
               )}
            </div>
          </div>

          {/* System Anomalies */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 px-2">
               <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center text-error shadow-2xl shadow-error/10">
                  <ShieldAlert size={24} />
               </div>
               <div>
                  <h2 className="text-lg font-bold text-white tracking-tight uppercase italic">Anomalies</h2>
                  <p className="text-[9px] font-bold text-text-muted/40 uppercase tracking-[0.3em]">Error Log Analytics</p>
               </div>
            </div>
            
            <div className="space-y-6">
               {bugs.length === 0 ? (
                 <div className="py-16 bg-white/[0.01] border border-white/5 rounded-[2.5rem] text-center opacity-20 italic text-sm font-bold uppercase tracking-widest">
                    Zero anomaly detections
                 </div>
               ) : (
                 bugs.map((b: any, i: number) => (
                   <div key={b._id} className="bg-bg-card/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-right-8 duration-1000 relative group overflow-hidden" style={{ animationDelay: `${i * 100}ms` }}>
                     <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-error/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                     <div className="flex justify-between items-center mb-4 relative z-10">
                        <p className="text-white text-sm font-black tracking-tight line-clamp-2 flex-1 pr-6 group-hover:text-error transition-colors">{b.description}</p>
                        <span className="px-3 py-1 bg-error/10 border border-error/20 rounded-lg text-[9px] font-black text-error uppercase tracking-[0.2em] shadow-xl shadow-error/5">
                          {b.status}
                        </span>
                     </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUserDetail
