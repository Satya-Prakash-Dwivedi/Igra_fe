import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  Ticket,
  ShieldAlert,
  User as UserIcon,
  Calendar,
  Building,
  Shield,
  ExternalLink,
  Database,
  Activity,
  Mail,
  ShieldCheck,
} from 'lucide-react'
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
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    icon?: any
    variant?: 'primary' | 'error' | 'success'
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

  const [visibleOrdersCount, setVisibleOrdersCount] = useState(5)

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
        <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin" />
        <p className="text-sm font-medium text-text-muted">Loading user profile...</p>
      </div>
    )

  if (error)
    return (
      <div className="p-8 max-w-2xl mx-auto mt-10">
        <div className="bg-error/5 border border-error/10 rounded-2xl p-8 flex flex-col items-center text-center gap-4">
          <ShieldAlert size={32} className="text-error" />
          <h2 className="text-xl font-bold text-white">Access Failed</h2>
          <p className="text-sm text-text-muted">{error}</p>
          <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
            Retry Connection
          </Button>
        </div>
      </div>
    )

  if (!data)
    return (
      <div className="p-12 flex flex-col items-center justify-center opacity-40 font-semibold text-xl">
        No User Record Found
      </div>
    )

  const { user, orders, tickets, bugs } = data

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8 relative">
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-2 text-text-muted hover:text-white text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Users
      </Link>

      {/* User Profile Header */}
      <div className="bg-bg-card border border-white/10 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
          <div className="relative flex-shrink-0">
            <img
              src={
                user.avatar
                  ? resolveApiUrl(user.avatar)
                  : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
              }
              alt="avatar"
              className="w-28 h-28 rounded-xl object-cover border border-white/10"
            />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-bg-card">
              <ShieldCheck size={16} className="text-white" />
            </div>
          </div>

          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="space-y-2">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-center lg:justify-start">
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                <span className="px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-md text-[10px] font-semibold text-primary uppercase tracking-wide inline-flex items-center">
                  Verified User
                </span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2 text-text-muted">
                <Mail size={14} className="text-primary" />
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <div className="bg-white/5 rounded-lg px-4 py-3 border border-white/5 min-w-[120px]">
                <div className="flex items-center gap-2 text-text-muted mb-1">
                  <Calendar size={12} className="text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wider">Enrolled</p>
                </div>
                <p className="text-sm font-medium text-white">
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="bg-white/5 rounded-lg px-4 py-3 border border-white/5 min-w-[120px]">
                <div className="flex items-center gap-2 text-text-muted mb-1">
                  <Shield size={12} className="text-emerald-500" />
                  <p className="text-xs font-semibold uppercase tracking-wider">Role</p>
                </div>
                <p className="text-sm font-medium text-primary capitalize">{user.role}</p>
              </div>

              {user.companyName && (
                <div className="bg-white/5 rounded-lg px-4 py-3 border border-white/5 min-w-[120px]">
                  <div className="flex items-center gap-2 text-text-muted mb-1">
                    <Building size={12} className="text-blue-500" />
                    <p className="text-xs font-semibold uppercase tracking-wider">Company</p>
                  </div>
                  <p className="text-sm font-medium text-white truncate max-w-[150px]">
                    {user.companyName}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full lg:w-48">
            <Button
              variant="primary"
              className="w-full justify-center gap-2"
              onClick={() =>
                window.open(
                  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(user.email)}`,
                  '_blank'
                )
              }
            >
              <Mail size={16} />
              <span>Email User</span>
            </Button>

            {user.role === 'user' ? (
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: 'Elevate Identity',
                    message: `Are you sure you want to elevate ${user.name} to Staff status? This will grant them administrative access to studio operations.`,
                    icon: ShieldCheck,
                    variant: 'primary',
                    onConfirm: async () => {
                      try {
                        await adminService.assignStaff(user._id)
                        window.location.reload()
                      } catch (err) {
                        alert('Elevation failed')
                      }
                    },
                  })
                }}
              >
                Elevate to Staff
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-center border-error/20 text-error hover:bg-error/10"
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: 'Revoke Privilege',
                    message: `Are you sure you want to revoke Staff status for ${user.name}? They will lose all administrative privileges.`,
                    icon: ShieldAlert,
                    variant: 'error',
                    onConfirm: async () => {
                      try {
                        await adminService.removeStaff(user._id)
                        window.location.reload()
                      } catch (err) {
                        alert('Revocation failed')
                      }
                    },
                  })
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
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Order History */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Package size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Order History</h2>
                <p className="text-xs text-text-muted font-medium">All projects and deliveries</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-white/5 rounded-md text-xs font-semibold text-white">
              {orders.length} Active
            </div>
          </div>

          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="py-16 bg-bg-card border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-4 text-text-muted">
                <Database size={32} className="opacity-50" />
                <p className="text-sm font-medium">No order history found for this user.</p>
              </div>
            ) : (
              <>
                {orders.slice(0, visibleOrdersCount).map((o: any) => (
                  <Link
                    key={o._id}
                    to={`/admin/orders/${o._id}`}
                    className="group block bg-bg-card border border-white/5 hover:border-primary/40 rounded-xl p-5 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <span className="text-primary text-xs font-semibold uppercase tracking-wider block">
                          #{o.orderNumber || o._id.substring(0, 8)}
                        </span>
                        <h3 className="text-white font-semibold text-base line-clamp-1">
                          {o.title}
                        </h3>
                      </div>
                      <div
                        className={cn(
                          'px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border',
                          o.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-white/5 text-text-muted border-white/10'
                        )}
                      >
                        {o.status.replace('_', ' ')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-text-muted">
                        <Activity size={12} />
                        <span className="text-xs font-medium">
                          {new Date(o.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <ExternalLink
                        size={16}
                        className="text-text-muted group-hover:text-primary transition-colors"
                      />
                    </div>
                  </Link>
                ))}

                {visibleOrdersCount < orders.length && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setVisibleOrdersCount((prev) => prev + 5)}
                      className="text-sm border-white/10 bg-white/5 hover:bg-white/10 w-full sm:w-auto"
                    >
                      Load More Orders
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Support & Bugs */}
        <div className="space-y-8">
          {/* Support Tickets */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Ticket size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Support Tickets</h2>
              </div>
            </div>

            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="py-8 bg-bg-card border border-white/5 rounded-xl text-center text-sm font-medium text-text-muted">
                  No active support tickets
                </div>
              ) : (
                tickets.map((t: any) => (
                  <div
                    key={t._id}
                    className="bg-bg-card border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="px-2.5 py-1 bg-white/5 rounded text-[10px] font-semibold text-white uppercase tracking-wider">
                        {t.category}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded',
                          t.status === 'open'
                            ? 'text-emerald-500 bg-emerald-500/10'
                            : 'text-text-muted bg-white/5'
                        )}
                      >
                        {t.status}
                      </span>
                    </div>
                    <p className="text-text-muted text-sm line-clamp-2">{t.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bug Reports */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center text-error">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Bug Reports</h2>
              </div>
            </div>

            <div className="space-y-3">
              {bugs.length === 0 ? (
                <div className="py-8 bg-bg-card border border-white/5 rounded-xl text-center text-sm font-medium text-text-muted">
                  No bug reports submitted
                </div>
              ) : (
                bugs.map((b: any) => (
                  <div
                    key={b._id}
                    className="bg-bg-card border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-white text-sm font-medium line-clamp-2 pr-4">
                        {b.description}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-error/10 border border-error/20 rounded text-[10px] font-semibold text-error uppercase tracking-wider inline-block">
                      {b.status}
                    </span>
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
