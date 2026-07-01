import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  ArrowRight,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import adminService from '../../services/adminService'
import type { AdminUser } from '../../services/adminService'
import { serializeError, createLogger } from '../../services/logger'
import Button from '../../components/Button'
import { resolveApiUrl } from '../../utils/urlUtils'

const logger = createLogger('AdminUsers')

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await adminService.listUsers({ page, limit: 20, search })
      setUsers(data.users)
      setTotalPages(data.totalPages)
      setTotalUsers(data.total)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users')
      logger.error('failed_to_load_users', { err: serializeError(err) })
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers()
    }, 300)
    return () => clearTimeout(handler)
  }, [fetchUsers])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-10 relative">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">User Management</h1>
            </div>
          </div>
          <p className="text-text-muted text-sm font-medium mt-2">
            Managing {totalUsers} registered users across the platform.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-[350px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-white/10 rounded-lg text-sm font-medium text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </form>
      </div>

      {error && (
        <div className="bg-error/5 border border-error/20 text-error px-6 py-4 rounded-lg flex items-center gap-3">
          <ShieldAlert size={18} />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-bg-card border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  User Profile
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Joined Date
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">
                  Total Orders
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 size={32} className="text-primary animate-spin" />
                      <p className="text-sm font-medium text-text-muted">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3 text-text-muted">
                      <Users size={32} className="opacity-50" />
                      <p className="text-sm font-medium">No users found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user: AdminUser) => (
                  <tr key={user._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                          <img
                            src={
                              user.avatar
                                ? resolveApiUrl(user.avatar)
                                : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
                            }
                            alt="avatar"
                            className="w-10 h-10 rounded-full border border-white/10 object-cover"
                          />
                          {user.role === 'admin' && (
                            <div className="absolute -bottom-1 -right-1 bg-primary p-0.5 rounded-full border-2 border-bg-card">
                              <ShieldCheck size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <Link
                            to={`/admin/users/${user._id}`}
                            className="text-sm font-semibold text-white hover:text-primary transition-colors truncate"
                          >
                            {user.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            {user.role === 'admin' && (
                              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-semibold uppercase tracking-wider">
                                Admin
                              </span>
                            )}
                            {user.role === 'staff' && (
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-semibold uppercase tracking-wider">
                                Staff
                              </span>
                            )}
                            {user.role === 'user' && (
                              <span className="px-2 py-0.5 bg-white/5 text-text-muted rounded text-[10px] font-semibold uppercase tracking-wider">
                                Client
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-text-muted text-sm font-medium truncate max-w-[200px]">
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white text-sm font-medium">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-base font-semibold text-white">
                        {user.totalOrders || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/users/${user._id}`}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-text-muted hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <ArrowRight size={18} />
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
        <div className="flex justify-between items-center pt-4">
          <p className="text-sm text-text-muted">
            Showing page <span className="font-semibold text-white">{page}</span> of{' '}
            <span className="font-semibold text-white">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p: number) => p - 1)}
              className="px-3 py-1.5 text-sm h-auto bg-bg-card border-white/10 flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              Prev
            </Button>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p: number) => p + 1)}
              className="px-3 py-1.5 text-sm h-auto bg-bg-card border-white/10 flex items-center gap-1"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
