import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4">
        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle size={18} className="text-red-600" />
        </div>
        <p className="text-sm text-gray-600 pt-1.5">{message}</p>
      </div>
      <div className="flex gap-3 mt-6 justify-end">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : null}
          Delete
        </button>
      </div>
    </Modal>
  )
}
