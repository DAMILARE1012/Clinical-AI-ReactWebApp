import { useState, useEffect, useCallback } from 'react'
import { Search, Trash2, UserCog, Users, Shield, User } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar from '../components/Layout/Sidebar'
import Navbar from '../components/Layout/Navbar'
import Badge from '../components/UI/Badge'
import ConfirmDialog from '../components/UI/ConfirmDialog'
import { usersAPI } from '../api/users'
import { useAuth } from '../context/AuthContext'

function RoleSelect({ userId, currentRole, onUpdate, disabled }) {
  const [loading, setLoading] = useState(false)

  const change = async (e) => {
    setLoading(true)
    try {
      await onUpdate(userId, { role: e.target.value })
      toast.success('Role updated')
    } catch {
      toast.error('Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
      value={currentRole}
      onChange={change}
      disabled={disabled || loading}
    >
      <option value="researcher">Researcher</option>
      <option value="admin">Admin</option>
    </select>
  )
}

export default function AdminPanel() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const data = await usersAPI.list()
      setUsers(data)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  useEffect(() => {
    if (!search.trim()) { setFiltered(users); return }
    const q = search.toLowerCase()
    setFiltered(
      users.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      )
    )
  }, [search, users])

  const handleUpdateRole = async (userId, payload) => {
    const updated = await usersAPI.update(userId, payload)
    setUsers((p) => p.map((u) => (u.id === updated.id ? updated : u)))
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await usersAPI.delete(deleteTarget.id)
      setUsers((p) => p.filter((u) => u.id !== deleteTarget.id))
      toast.success('User removed')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete user')
    } finally {
      setDeleteLoading(false)
    }
  }

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    researchers: users.filter((u) => u.role === 'researcher').length,
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Navbar title="Team Management" />

        <main className="flex-1 p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Users, label: 'Total Members', value: stats.total, color: 'bg-brand-600' },
              { icon: Shield, label: 'Admins / PIs', value: stats.admins, color: 'bg-purple-500' },
              { icon: User, label: 'Researchers', value: stats.researchers, color: 'bg-emerald-500' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="card p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-sm text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-field pl-9 text-sm py-2"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Users table */}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Member
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Role
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                    Joined
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
                            <div className="space-y-1.5">
                              <div className="h-3.5 w-32 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-6 w-20 bg-gray-100 rounded animate-pulse" />
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse" />
                        </td>
                        <td className="px-5 py-4" />
                      </tr>
                    ))
                  : filtered.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-white">
                                {u.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 flex items-center gap-1.5">
                                {u.name}
                                {u.id === currentUser?.id && (
                                  <span className="text-xs text-gray-400 font-normal">(you)</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {u.id === currentUser?.id ? (
                            <Badge value={u.role} />
                          ) : (
                            <RoleSelect
                              userId={u.id}
                              currentRole={u.role}
                              onUpdate={handleUpdateRole}
                            />
                          )}
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <span className="text-xs text-gray-400">
                            {new Date(u.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {u.id !== currentUser?.id && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors ml-auto"
                              title="Remove user"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>

            {!loading && filtered.length === 0 && (
              <div className="py-12 text-center">
                <UserCog size={28} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No users found</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${deleteTarget?.name} (${deleteTarget?.email})? Their projects will remain in the system.`}
      />
    </div>
  )
}
