import { useState } from 'react'
import { ChevronDown, ChevronUp, ClipboardList, BarChart2, Edit2, Trash2, Calendar } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function ExperimentCard({ experiment, projectOwnerId, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const { user } = useAuth()
  const canModify = user?.role === 'admin' || user?.id === projectOwnerId

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="card overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <ClipboardList size={16} className="text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{experiment.title}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar size={11} /> {formatDate(experiment.created_at)}
            </span>
            {experiment.log_text && (
              <span className="text-xs text-gray-400">• Log recorded</span>
            )}
            {experiment.results_text && (
              <span className="text-xs text-emerald-600 font-medium">• Results available</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {canModify && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(experiment) }}
                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(experiment) }}
                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
          <button className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-100 animate-fade-in">
          {experiment.log_text && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList size={14} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Experiment Log
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {experiment.log_text}
              </p>
            </div>
          )}

          {experiment.results_text && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 size={14} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Results
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {experiment.results_text}
              </p>
            </div>
          )}

          {!experiment.log_text && !experiment.results_text && (
            <div className="p-4 text-sm text-gray-400 italic">No content logged yet.</div>
          )}
        </div>
      )}
    </div>
  )
}
