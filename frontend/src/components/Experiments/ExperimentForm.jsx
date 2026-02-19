import { useState, useEffect } from 'react'
import Modal from '../UI/Modal'

export default function ExperimentForm({ open, onClose, onSubmit, initial }) {
  const isEdit = !!initial
  const [form, setForm] = useState({ title: '', log_text: '', results_text: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { title: initial.title, log_text: initial.log_text ?? '', results_text: initial.results_text ?? '' }
          : { title: '', log_text: '', results_text: '' }
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
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Experiment' : 'Log New Experiment'}
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Experiment title</label>
          <input
            className="input-field"
            name="title"
            placeholder="e.g. Batch 3 — Control Group Analysis"
            value={form.title}
            onChange={handle}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="label">
            Experiment log
            <span className="ml-1 text-xs font-normal text-gray-400">(observations, methods, conditions)</span>
          </label>
          <textarea
            className="input-field resize-none"
            name="log_text"
            rows={4}
            placeholder="Describe what was done, under what conditions, and any notable observations..."
            value={form.log_text}
            onChange={handle}
          />
        </div>

        <div>
          <label className="label">
            Results
            <span className="ml-1 text-xs font-normal text-gray-400">(findings, measurements, conclusions)</span>
          </label>
          <textarea
            className="input-field resize-none"
            name="results_text"
            rows={4}
            placeholder="Document your findings, measured values, statistical outcomes, and conclusions..."
            value={form.results_text}
            onChange={handle}
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isEdit ? 'Save changes' : 'Log experiment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
