import React, { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import adminService from '../../services/adminService'
import { serializeError, createLogger } from '../../services/logger'

const logger = createLogger('AdminUsers')

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([])
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
      console.log('AdminUsers fetch result:', data)
      setUsers(data.users)
      setTotalPages(data.totalPages)
      setTotalUsers(data.total)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users')
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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Users</h1>
          <p className="text-text-muted text-sm mt-1">Manage platform clients</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-error/10 border border-error/20 text-error p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex justify-between items-center gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-dark border border-border rounded-lg text-sm text-text-main focus:border-primary/50 outline-none transition-colors shadow-inner"
            />
          </form>
          <div className="text-sm text-text-muted">
            Total Users: <span className="font-semibold text-text-main">{totalUsers}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead>
              <tr className="bg-bg-dark border-b border-border text-xs uppercase tracking-wider text-text-muted">
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Joined At</th>
                <th className="px-6 py-4 font-semibold text-right">Total Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-text-muted">Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-text-muted">No users found.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id} className="hover:bg-bg-dark/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/admin/users/${user._id}`} className="flex items-center gap-3 w-full outline-none">
                        <img 
                          src={user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                          alt="avatar" 
                          className="w-8 h-8 rounded-full border border-border/50 object-cover"
                        />
                        <span className="text-sm font-medium text-text-main hover:text-primary transition-colors">{user.name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-text-main text-right">
                      {user.totalOrders || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-border flex justify-between items-center">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-bg-dark border border-border rounded-lg text-sm disabled:opacity-50 hover:bg-bg-card transition-colors text-text-main shadow-sm"
            >
              Previous
            </button>
            <span className="text-sm text-text-muted">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-bg-dark border border-border rounded-lg text-sm disabled:opacity-50 hover:bg-bg-card transition-colors text-text-main shadow-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
