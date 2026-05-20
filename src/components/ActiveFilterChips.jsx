import { X } from 'lucide-react'

const CATEGORY_LABELS = {
  department: 'Department',
  location: 'Location',
  manager: 'Manager',
  employmentType: 'Type',
  status: 'Status',
}

export default function ActiveFilterChips({ filters, setFilters }) {
  const chips = []
  for (const [category, values] of Object.entries(filters)) {
    for (const value of values) {
      chips.push({ category, value })
    }
  }

  if (chips.length === 0) return null

  function remove(category, value) {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].filter((v) => v !== value),
    }))
  }

  function clearAll() {
    setFilters({
      department: [],
      location: [],
      manager: [],
      employmentType: [],
      status: [],
    })
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-5 py-2.5 bg-rippling-surface border-b border-rippling-line-2">
      <span className="text-[11.5px] text-rippling-muted font-medium mr-1">Active filters:</span>
      {chips.map(({ category, value }) => (
        <button
          key={`${category}-${value}`}
          onClick={() => remove(category, value)}
          className="group inline-flex items-center gap-1 h-6 pl-2 pr-1.5 rounded-full bg-white border border-rippling-line text-[12px] text-rippling-ink-2 hover:border-rippling-plum/40 ui-interactive-chip transition-colors"
        >
          <span className="text-rippling-muted">{CATEGORY_LABELS[category]}:</span>
          <span className="font-medium">{value}</span>
          <X size={11} strokeWidth={2} className="text-rippling-muted group-hover:text-rippling-ink" />
        </button>
      ))}
      <button
        onClick={clearAll}
        className="text-[11.5px] text-rippling-muted hover:text-rippling-ink underline ml-2"
      >
        Clear all
      </button>
    </div>
  )
}
