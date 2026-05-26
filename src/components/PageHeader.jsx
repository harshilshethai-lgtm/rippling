import { Search, Filter, Download, UserPlus, UserMinus, Layers, ChevronDown } from 'lucide-react'
import { classNames } from '../lib/utils'
import { PEOPLE_TABS } from '../data/employees'

export default function PageHeader({
  totalCount,
  filteredCount,
  peopleTab,
  onPeopleTabChange,
  search,
  setSearch,
  onOpenFilters,
  activeFilterCount,
  selectedCount,
  onStartBulkChange,
}) {
  return (
    <div className="bg-white border-b border-rippling-line">
      {/* Top row: title and primary actions */}
      <div className="flex items-end justify-between px-5 pt-5 pb-3">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-rippling-muted mb-1">
            <span>HR</span>
            <span>›</span>
            <span>People</span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-[22px] font-semibold text-rippling-ink tracking-tight">People</h1>
            <PeopleCount filteredCount={filteredCount} totalCount={totalCount} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-8 px-3 rounded-md border border-rippling-line text-[13px] text-rippling-ink-2 ui-interactive hover:border-rippling-ink-2/20 flex items-center gap-1.5 font-medium transition-colors">
            <Download size={14} strokeWidth={1.75} />
            <span>Export</span>
          </button>

          <button
            type="button"
            className="h-8 px-3 rounded-md border border-rippling-line text-[13px] text-rippling-ink-2 ui-interactive hover:border-rippling-ink-2/20 flex items-center gap-1.5 font-medium transition-colors"
          >
            <UserPlus size={14} strokeWidth={1.75} />
            <span>Hire</span>
          </button>

          <button
            type="button"
            className="h-8 px-3 rounded-md border border-rippling-line text-[13px] text-rippling-ink-2 ui-interactive hover:border-rippling-ink-2/20 flex items-center gap-1.5 font-medium transition-colors"
          >
            <UserMinus size={14} strokeWidth={1.75} />
            <span>Offboard</span>
          </button>

          {/* Bulk Changes - primary CTA */}
          <button
            onClick={onStartBulkChange}
            className={classNames(
              'h-8 pl-3 pr-2.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-all',
              'bg-rippling-plum text-white hover:bg-rippling-plum-hover shadow-sm hover:shadow'
            )}
          >
            <Layers size={14} strokeWidth={2} />
            <span>Bulk Changes</span>
            {selectedCount > 0 && (
              <span className="ml-0.5 bg-white/20 text-white text-[11px] font-semibold px-1.5 rounded">
                {selectedCount}
              </span>
            )}
            <ChevronDown size={12} strokeWidth={2.25} className="ml-0.5 opacity-80" />
          </button>
        </div>
      </div>

      {/* Bottom row: search and filter */}
      <div className="flex items-center gap-2 px-5 pb-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-rippling-muted"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, title, or manager..."
            className="w-full h-8 bg-white border border-rippling-line rounded-md pl-9 pr-3 text-[13px] placeholder:text-rippling-muted focus:outline-none focus:ring-1 focus:ring-rippling-primary focus:border-rippling-primary transition-colors"
          />
        </div>

        <button
          onClick={onOpenFilters}
          className={classNames(
            'h-8 px-3 rounded-md border text-[13px] flex items-center gap-1.5 font-medium transition-colors',
            activeFilterCount > 0
              ? 'border-rippling-plum/40 bg-rippling-chip text-rippling-plum ui-interactive-chip'
              : 'border-rippling-line text-rippling-ink-2 ui-interactive hover:border-rippling-ink-2/20'
          )}
        >
          <Filter size={13} strokeWidth={2} />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="ml-0.5 bg-rippling-plum text-white text-[10.5px] font-semibold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="flex-1" />
        <div className="flex items-center gap-1 text-[12.5px]">
          {PEOPLE_TABS.map((tab) => (
            <TabButton
              key={tab.id}
              active={peopleTab === tab.id}
              onClick={() => onPeopleTabChange(tab.id)}
            >
              {tab.label}
            </TabButton>
          ))}
          <div className="w-px h-4 bg-rippling-line mx-1" />
          <TabButton
            active={peopleTab === 'slides'}
            onClick={() => onPeopleTabChange('slides')}
          >
            Slides
          </TabButton>
        </div>
      </div>
    </div>
  )
}

function PeopleCount({ filteredCount, totalCount }) {
  const isFiltered = filteredCount !== totalCount

  if (!isFiltered) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-rippling-surface-2 text-[13px] font-medium text-rippling-muted tabular-nums">
        {totalCount}
      </span>
    )
  }

  return (
    <span className="px-2 py-0.5 rounded-full bg-rippling-surface-2 text-[13px] font-medium tabular-nums">
      <span className="text-rippling-ink">{filteredCount}</span>
      <span className="text-rippling-muted"> of {totalCount}</span>
    </span>
  )
}

function TabButton({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'h-7 px-3 rounded-md text-[12.5px] font-medium transition-colors',
        active
          ? 'bg-rippling-chip text-rippling-plum'
          : 'text-rippling-muted ui-interactive-chip hover:text-rippling-ink-2'
      )}
    >
      {children}
    </button>
  )
}
