import { useState, useEffect } from 'react'
import Modal from '../UI/Modal'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'archived', label: 'Archived' },
]

export default function ProjectForm({ open, onClose, onSubmit, initial }) {
  const isEdit = !!initial
  const [form, setForm] = useState({ title: '', description: '', status: 'active' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { title: initial.title, description: initial.description, status: initial.status }
          : { title: '', description: '', status: 'active' }
      )
    }
  }, [open, initial])

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(form)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Project' : 'New Research Project'}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Project title</label>
          <input
            className="input-field"
            name="title"
            placeholder="e.g. CRISPR Gene Expression Study"
            value={form.title}
            onChange={handle}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input-field resize-none"
            name="description"
            rows={4}
            placeholder="Describe the research objectives, methodology, and scope..."
            value={form.description}
            onChange={handle}
            required
          />
        </div>

        <div>
          <label className="label">Status</label>
          <select className="input-field" name="status" value={form.status} onChange={handle}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isEdit ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
