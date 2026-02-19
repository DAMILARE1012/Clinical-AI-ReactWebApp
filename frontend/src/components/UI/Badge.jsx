const variants = {
  active:     'bg-emerald-50 text-emerald-700 ring-emerald-200',
  completed:  'bg-blue-50 text-blue-700 ring-blue-200',
  on_hold:    'bg-amber-50 text-amber-700 ring-amber-200',
  archived:   'bg-gray-100 text-gray-600 ring-gray-200',
  admin:      'bg-purple-50 text-purple-700 ring-purple-200',
  researcher: 'bg-brand-50 text-brand-700 ring-brand-200',
}

const labels = {
  active: 'Active',
  completed: 'Completed',
  on_hold: 'On Hold',
  archived: 'Archived',
  admin: 'Admin',
  researcher: 'Researcher',
}

export default function Badge({ value }) {
  const cls = variants[value] ?? 'bg-gray-100 text-gray-600 ring-gray-200'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${cls}`}
    >
      {labels[value] ?? value}
    </span>
  )
}
