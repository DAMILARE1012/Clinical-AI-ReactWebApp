import { useNavigate } from 'react-router-dom'
import { FlaskConical, ArrowRight, Calendar, Edit2, Trash2 } from 'lucide-react'
import Badge from '../UI/Badge'
import { useAuth } from '../../context/AuthContext'

export default function ProjectCard({ project, onEdit, onDelete }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canModify = user?.role === 'admin' || user?.id === project.user_id

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
          <FlaskConical size={18} className="text-brand-600" />
        </div>
        <Badge value={project.status} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate mb-1">{project.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar size={12} />
          {formatDate(project.created_at)}
        </div>

        <div className="flex items-center gap-1">
          {canModify && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(project) }}
                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Edit"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(project) }}
                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
          <button
            onClick={() => navigate(`/projects/${project.id}`)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
            title="Open"
          >
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
