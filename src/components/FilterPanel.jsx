import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { DEPARTMENTS, LOCATIONS, MANAGERS, EMPLOYMENT_TYPES, STATUSES } from '../data/employees'
import { classNames } from '../lib/utils'

export default function FilterPanel({ open, onClose, filters, setFilters }) {
  if (!open) return null

  function toggle(category, value) {
    setFilters((prev) => {
      const current = prev[category] || []
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [category]: next }
    })
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

  const activeCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 anim-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[380px] bg-white shadow-rippling-dropdown z-50 flex flex-col anim-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rippling-line">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-rippling-ink">Filters</h2>
            {activeCount > 0 && (
              <span className="text-[11px] font-medium bg-rippling-chip text-rippling-plum px-1.5 py-0.5 rounded">
                {activeCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink transition-colors"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          <FilterGroup
            label="Department"
            options={DEPARTMENTS}
            selected={filters.department}
            onToggle={(v) => toggle('department', v)}
          />
          <FilterGroup
            label="Work location"
            options={LOCATIONS}
            selected={filters.location}
            onToggle={(v) => toggle('location', v)}
          />
          <FilterGroup
            label="Employment type"
            options={EMPLOYMENT_TYPES}
            selected={filters.employmentType}
            onToggle={(v) => toggle('employmentType', v)}
          />
          <FilterGroup
            label="Status"
            options={STATUSES}
            selected={filters.status}
            onToggle={(v) => toggle('status', v)}
          />
          <FilterGroup
            label="Manager"
            options={MANAGERS}
            selected={filters.manager}
            onToggle={(v) => toggle('manager', v)}
            searchable
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-rippling-line">
          <button
            onClick={clearAll}
            className="text-[13px] text-rippling-muted hover:text-rippling-ink font-medium"
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-rippling-plum hover:bg-rippling-plum-hover text-white rounded-md text-[13px] font-medium transition-colors"
          >
            Apply filters
          </button>
        </div>
      </div>
    </>
  )
}

function FilterGroup({ label, options, selected, onToggle, searchable }) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(true)

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options

  return (
    <div className="py-3 border-b border-rippling-line-2 last:border-b-0">
      <button
        className="flex items-center justify-between w-full mb-2 group"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-[12px] font-semibold text-rippling-ink uppercase tracking-wide">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <span className="text-[11px] font-medium text-rippling-plum">{selected.length}</span>
          )}
          <span className="text-rippling-muted group-hover:text-rippling-ink text-[12px]">
            {expanded ? '−' : '+'}
          </span>
        </div>
      </button>

      {expanded && (
        <>
          {searchable && (
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full h-8 border border-rippling-line rounded-md px-2.5 text-[12.5px] mb-2 focus:outline-none focus:ring-1 focus:ring-rippling-primary focus:border-rippling-primary"
            />
          )}
          <div className={searchable ? 'max-h-48 overflow-y-auto' : ''}>
            {filtered.map((option) => {
              const isSelected = selected.includes(option)
              return (
                <button
                  key={option}
                  onClick={() => onToggle(option)}
                  className="flex items-center gap-2.5 w-full py-1.5 px-1 rounded ui-interactive text-left transition-colors"
                >
                  <div
                    className={classNames(
                      'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                      isSelected
                        ? 'bg-rippling-plum border-rippling-plum'
                        : 'bg-white border-gray-300'
                    )}
                  >
                    {isSelected && <Check size={11} strokeWidth={3} className="text-white" />}
                  </div>
                  <span className="text-[13px] text-rippling-ink-2">{option}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
