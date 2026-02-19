import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, FolderOpen, TrendingUp, Users, FlaskConical } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar from '../components/Layout/Sidebar'
import Navbar from '../components/Layout/Navbar'
import ProjectCard from '../components/Projects/ProjectCard'
import ProjectForm from '../components/Projects/ProjectForm'
import ConfirmDialog from '../components/UI/ConfirmDialog'
import { projectsAPI } from '../api/projects'
import { useAuth } from '../context/AuthContext'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectsAPI.list()
      setProjects(data)
    } catch {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  useEffect(() => {
    let result = projects
    if (statusFilter !== 'all') result = result.filter((p) => p.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [projects, search, statusFilter])

  const handleCreate = async (form) => {
    try {
      const created = await projectsAPI.create(form)
      setProjects((p) => [created, ...p])
      toast.success('Project created and indexed')
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to create project')
      throw err
    }
  }

  const handleEdit = async (form) => {
    try {
      const updated = await projectsAPI.update(editTarget.id, form)
      setProjects((p) => p.map((x) => (x.id === updated.id ? updated : x)))
      toast.success('Project updated')
      setEditTarget(null)
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update project')
      throw err
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await projectsAPI.delete(deleteTarget.id)
      setProjects((p) => p.filter((x) => x.id !== deleteTarget.id))
      toast.success('Project deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete project')
    } finally {
      setDeleteLoading(false)
    }
  }

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Navbar title="Dashboard" />

        <main className="flex-1 p-6 space-y-6">
          {/* Welcome banner */}
          <div className="bg-gradient-to-r from-brand-700 to-brand-500 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-bold mb-1">
              Welcome back, {user?.name?.split(' ')[0]}
            </h2>
            <p className="text-indigo-200 text-sm">
              {stats.active} active project{stats.active !== 1 ? 's' : ''} in your shared knowledge base
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={FolderOpen} label="Total Projects" value={stats.total} color="bg-brand-600" />
            <StatCard icon={TrendingUp} label="Active" value={stats.active} color="bg-emerald-500" />
            <StatCard icon={FlaskConical} label="Completed" value={stats.completed} color="bg-blue-500" />
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-1 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input-field pl-9 py-2 text-sm"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Status filter */}
              <select
                className="input-field py-2 text-sm w-auto"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <button
              className="btn-primary flex-shrink-0"
              onClick={() => { setEditTarget(null); setFormOpen(true) }}
            >
              <Plus size={16} />
              New Project
            </button>
          </div>

          {/* Projects grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-5 h-44 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <FolderOpen size={28} className="text-gray-400" />
              </div>
              <p className="font-medium text-gray-700">
                {search || statusFilter !== 'all' ? 'No matching projects' : 'No projects yet'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first research project to get started'}
              </p>
              {!search && statusFilter === 'all' && (
                <button
                  className="btn-primary mt-4"
                  onClick={() => { setEditTarget(null); setFormOpen(true) }}
                >
                  <Plus size={16} /> New Project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={(p) => { setEditTarget(p); setFormOpen(true) }}
                  onDelete={(p) => setDeleteTarget(p)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <ProjectForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={editTarget ? handleEdit : handleCreate}
        initial={editTarget}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will also remove all associated experiments and their embeddings from the knowledge base.`}
      />
    </div>
  )
}
