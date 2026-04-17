import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Package, Ticket, ShieldAlert } from 'lucide-react'
import adminService from '../../services/adminService'
import { createLogger, serializeError } from '../../services/logger'
import { cn } from '../../components/Button'

const logger = createLogger('AdminUserDetail')

const AdminUserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) fetchUserDetail()
  }, [id])

  const fetchUserDetail = async () => {
    try {
      setLoading(true)
      const res = await adminService.getUserDetail(id!)
      setData(res)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user details')
      logger.error('failed_to_load_user_detail', { err: serializeError(err) })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-text-muted">Loading user details...</div>
  if (error) return <div className="p-8 text-error">{error}</div>
  if (!data) return <div className="p-8 text-text-muted">User not found</div>

  const { user, orders, tickets, bugs } = data

  return (
    <div className="p-8 max-w-5xl">
      <Link to="/admin/users" className="inline-flex items-center gap-2 text-text-muted hover:text-text-main text-sm font-medium mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Users
      </Link>

      {/* Profile Header */}
      <div className="bg-bg-card border border-border rounded-xl p-6 shadow-sm flex items-start gap-6 mb-8">
        <img 
          src={user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
          alt="avatar" 
          className="w-24 h-24 rounded-full border border-border/50 object-cover shadow-sm bg-bg-dark"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-main mb-1">{user.name}</h1>
          <p className="text-text-muted text-sm mb-4">{user.email}</p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-bg-dark rounded-lg px-4 py-2 border border-border">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Joined</p>
              <p className="text-sm font-semibold text-text-main">
                {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="bg-bg-dark rounded-lg px-4 py-2 border border-border">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Role</p>
              <p className="text-sm font-semibold text-text-main uppercase">{user.role}</p>
            </div>
            {user.companyName && (
              <div className="bg-bg-dark rounded-lg px-4 py-2 border border-border">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Company</p>
                <p className="text-sm font-semibold text-text-main">{user.companyName}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Orders Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-text-main">Orders ({orders.length})</h2>
          </div>
          
          <div className="bg-bg-card border border-border rounded-xl shadow-sm overflow-hidden divide-y divide-border/50">
             {orders.length === 0 ? (
               <div className="p-6 text-center text-text-muted text-sm">No orders yet.</div>
             ) : (
               orders.map((o: any) => (
                 <Link key={o._id} to={`/admin/orders/${o._id}`} className="block p-4 hover:bg-bg-dark/50 transition-colors">
                   <div className="flex justify-between items-start mb-2">
                     <div>
                       <span className="text-primary text-xs font-semibold uppercase tracking-wider block mb-1">
                         {o.orderNumber || o._id.substring(0, 8)}
                       </span>
                       <h3 className="text-sm font-medium text-text-main truncate max-w-[200px]">{o.title}</h3>
                     </div>
                     <span className={cn(
                       "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                       o.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                         "bg-bg-dark text-text-main border border-border"
                     )}>
                       {o.status.replace('_', ' ')}
                     </span>
                   </div>
                   <p className="text-[11px] text-text-muted">
                     {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                   </p>
                 </Link>
               ))
             )}
          </div>
        </div>

        {/* Support Section */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Ticket size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-text-main">Support Tickets ({tickets.length})</h2>
            </div>
            
            <div className="bg-bg-card border border-border rounded-xl shadow-sm overflow-hidden divide-y divide-border/50">
               {tickets.length === 0 ? (
                 <div className="p-4 text-center text-text-muted text-sm">No support tickets.</div>
               ) : (
                 tickets.map((t: any) => (
                   <div key={t._id} className="p-4">
                     <div className="flex justify-between items-baseline mb-1">
                       <span className="text-sm font-medium text-text-main">{t.category}</span>
                       <span className="text-[10px] font-bold uppercase text-text-muted bg-bg-dark px-2 py-0.5 rounded border border-border">
                         {t.status}
                       </span>
                     </div>
                     <p className="text-xs text-text-muted line-clamp-2 mt-2">{t.message}</p>
                   </div>
                 ))
               )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert size={20} className="text-error" />
              <h2 className="text-lg font-bold text-text-main">Bug Reports ({bugs.length})</h2>
            </div>
            
            <div className="bg-bg-card border border-border rounded-xl shadow-sm overflow-hidden divide-y divide-border/50">
               {bugs.length === 0 ? (
                 <div className="p-4 text-center text-text-muted text-sm">No bug reports.</div>
               ) : (
                 bugs.map((b: any) => (
                   <div key={b._id} className="p-4">
                     <div className="flex justify-between items-baseline mb-1">
                       <span className="text-sm font-medium text-text-main line-clamp-1 flex-1 pr-4">{b.description}</span>
                       <span className="text-[10px] font-bold uppercase text-error bg-error/10 px-2 py-0.5 rounded border border-error/20">
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
