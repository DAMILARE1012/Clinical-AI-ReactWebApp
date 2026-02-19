import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  FlaskConical,
  ClipboardList,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar from '../components/Layout/Sidebar'
import Navbar from '../components/Layout/Navbar'
import Badge from '../components/UI/Badge'
import ExperimentCard from '../components/Experiments/ExperimentCard'
import ExperimentForm from '../components/Experiments/ExperimentForm'
import ProjectForm from '../components/Projects/ProjectForm'
import ConfirmDialog from '../components/UI/ConfirmDialog'
import { projectsAPI } from '../api/projects'
import { experimentsAPI } from '../api/experiments'
import { useAuth } from '../context/AuthContext'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [project, setProject] = useState(null)
  const [experiments, setExperiments] = useState([])
  const [loading, setLoading] = useState(true)

  const [expFormOpen, setExpFormOpen] = useState(false)
  const [editExp, setEditExp] = useState(null)
  const [deleteExp, setDeleteExp] = useState(null)
  const [deleteExpLoading, setDeleteExpLoading] = useState(false)

  const [projFormOpen, setProjFormOpen] = useState(false)
  const [deleteProjOpen, setDeleteProjOpen] = useState(false)
  const [deleteProjLoading, setDeleteProjLoading] = useState(false)

  const canModify = user?.role === 'admin' || user?.id === project?.user_id

  const fetchData = useCallback(async () => {
    try {
      const [proj, exps] = await Promise.all([
        projectsAPI.get(id),
        experimentsAPI.list(id),
      ])
      setProject(proj)
      setExperiments(exps)
    } catch {
      toast.error('Failed to load project')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { fetchData() }, [fetchData])

  // Experiment handlers
  const handleCreateExp = async (form) => {
    try {
      const created = await experimentsAPI.create(id, form)
      setExperiments((p) => [created, ...p])
      toast.success('Experiment logged and indexed')
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to create experiment')
      throw err
    }
  }

  const handleEditExp = async (form) => {
    try {
      const updated = await experimentsAPI.update(editExp.id, form)
      setExperiments((p) => p.map((e) => (e.id === updated.id ? updated : e)))
      toast.success('Experiment updated')
      setEditExp(null)
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update experiment')
      throw err
    }
  }

  const handleDeleteExp = async () => {
    setDeleteExpLoading(true)
    try {
      await experimentsAPI.delete(deleteExp.id)
      setExperiments((p) => p.filter((e) => e.id !== deleteExp.id))
      toast.success('Experiment deleted')
      setDeleteExp(null)
    } catch {
      toast.error('Failed to delete experiment')
    } finally {
      setDeleteExpLoading(false)
    }
  }

  // Project handlers
  const handleEditProject = async (form) => {
    try {
      const updated = await projectsAPI.update(id, form)
      setProject(updated)
      toast.success('Project updated')
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update project')
      throw err
    }
  }

  const handleDeleteProject = async () => {
    setDeleteProjLoading(true)
    try {
      await projectsAPI.delete(id)
      toast.success('Project deleted')
      navigate('/dashboard')
    } catch {
      toast.error('Failed to delete project')
      setDeleteProjLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Navbar title="Project Detail" />

        <main className="flex-1 p-6 space-y-6 max-w-4xl">
          {/* Breadcrumb */}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors"
          >
            <ChevronLeft size={15} />
            Back to Dashboard
          </Link>

          {/* Project header */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FlaskConical size={22} className="text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900">{project.title}</h2>
                  <Badge value={project.status} />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Created {new Date(project.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>

              {canModify && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    className="btn-secondary px-3 py-1.5 text-xs"
                    onClick={() => setProjFormOpen(true)}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    className="btn-danger px-3 py-1.5 text-xs"
                    onClick={() => setDeleteProjOpen(true)}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Experiments section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-gray-400" />
                <h3 className="font-semibold text-gray-900">
                  Experiments
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    ({experiments.length})
                  </span>
                </h3>
              </div>
              <button
                className="btn-primary text-sm py-1.5"
                onClick={() => { setEditExp(null); setExpFormOpen(true) }}
              >
                <Plus size={15} /> Log Experiment
              </button>
            </div>

            {experiments.length === 0 ? (
              <div className="card p-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <ClipboardList size={24} className="text-gray-400" />
                </div>
                <p className="font-medium text-gray-700">No experiments logged yet</p>
                <p className="text-sm text-gray-400 mt-1 mb-4">
                  Start documenting your experiments — they'll be indexed into the AI knowledge base
                </p>
                <button
                  className="btn-primary"
                  onClick={() => { setEditExp(null); setExpFormOpen(true) }}
                >
                  <Plus size={15} /> Log First Experiment
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {experiments.map((exp) => (
                  <ExperimentCard
                    key={exp.id}
                    experiment={exp}
                    projectOwnerId={project.user_id}
                    onEdit={(e) => { setEditExp(e); setExpFormOpen(true) }}
                    onDelete={(e) => setDeleteExp(e)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <ExperimentForm
        open={expFormOpen}
        onClose={() => { setExpFormOpen(false); setEditExp(null) }}
        onSubmit={editExp ? handleEditExp : handleCreateExp}
        initial={editExp}
      />
      <ProjectForm
        open={projFormOpen}
        onClose={() => setProjFormOpen(false)}
        onSubmit={handleEditProject}
        initial={project}
      />
      <ConfirmDialog
        open={!!deleteExp}
        onClose={() => setDeleteExp(null)}
        onConfirm={handleDeleteExp}
        loading={deleteExpLoading}
        title="Delete Experiment"
        message={`Delete "${deleteExp?.title}"? This will also remove its data from the AI knowledge base.`}
      />
      <ConfirmDialog
        open={deleteProjOpen}
        onClose={() => setDeleteProjOpen(false)}
        onConfirm={handleDeleteProject}
        loading={deleteProjLoading}
        title="Delete Project"
        message={`Delete "${project?.title}" and all its experiments? This action cannot be undone.`}
      />
    </div>
  )
}
