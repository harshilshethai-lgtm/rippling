import { useMemo, useState } from 'react'
import { Layers, Plus, Search } from 'lucide-react'
import WorklistsTable from './worklist/WorklistsTable'
import { useWorklists } from '../hooks/useWorklists'
import { BUCKETS, bucketCounts, removeWorklist } from '../data/worklists'
import { classNames } from '../lib/utils'

export default function WorklistsPage({ onNavigate }) {
  const worklists = useWorklists()
  const [activeBucket, setActiveBucket] = useState('drafts')
  const [search, setSearch] = useState('')

  const counts = useMemo(() => bucketCounts(worklists), [worklists])

  const visible = useMemo(() => {
    const filteredByBucket = worklists.filter((w) => w.bucket === activeBucket)
    const q = search.trim().toLowerCase()
    if (!q) return filteredByBucket
    return filteredByBucket.filter((w) => {
      const haystack = [w.name, w.intent, w.leadName, w.role, w.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [worklists, activeBucket, search])

  function handleNewBulkChange() {
    onNavigate?.({ name: 'bulk' })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* ── Header ── */}
      <div className="bg-white border-b border-rippling-line">
        <div className="flex items-end justify-between px-5 pt-5 pb-3">
          <div>
            <div className="flex items-center gap-2 text-[12px] text-rippling-muted mb-1">
              <span>HR</span>
              <span>›</span>
              <span>People</span>
              <span>›</span>
              <span>Bulk Edit</span>
            </div>
            <div className="flex items-baseline gap-2.5">
              <h1 className="text-[22px] font-semibold text-rippling-ink tracking-tight">
                Worklists
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-rippling-surface-2 text-[13px] font-medium text-rippling-muted tabular-nums">
                {worklists.length}
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] text-rippling-muted max-w-xl">
              Draft worklists, approvals you're tracking, and changes you've completed all live
              here. Start a Bulk Change and it will save automatically as a draft.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewBulkChange}
              className="h-8 pl-2.5 pr-3 rounded-md text-[13px] font-medium flex items-center gap-1.5 bg-rippling-plum text-white hover:bg-rippling-plum-hover shadow-sm hover:shadow transition-all"
            >
              <Plus size={14} strokeWidth={2.25} />
              <span>New Bulk Change</span>
            </button>
          </div>
        </div>

        {/* Search + bucket tabs */}
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
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search worklists by name, intent, or lead..."
              className="w-full h-8 bg-white border border-rippling-line rounded-md pl-9 pr-3 text-[13px] placeholder:text-rippling-muted focus:outline-none focus:ring-1 focus:ring-rippling-primary focus:border-rippling-primary transition-colors"
            />
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1 text-[12.5px]" role="tablist">
            {BUCKETS.map((bucket) => (
              <BucketTab
                key={bucket.id}
                label={bucket.label}
                count={counts[bucket.id] ?? 0}
                active={activeBucket === bucket.id}
                onClick={() => setActiveBucket(bucket.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {visible.length === 0 && worklists.length === 0 && activeBucket === 'drafts' ? (
        <FirstRunEmptyState onStart={handleNewBulkChange} />
      ) : (
        <WorklistsTable entries={visible} bucket={activeBucket} onDelete={removeWorklist} />
      )}
    </div>
  )
}

function BucketTab({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={classNames(
        'h-7 pl-3 pr-2 rounded-md text-[12.5px] font-medium transition-colors flex items-center gap-1.5',
        active
          ? 'bg-rippling-chip text-rippling-plum'
          : 'text-rippling-muted ui-interactive-chip hover:text-rippling-ink-2'
      )}
    >
      <span>{label}</span>
      <span
        className={classNames(
          'min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] font-semibold inline-flex items-center justify-center tabular-nums',
          active
            ? 'bg-rippling-plum text-white'
            : 'bg-rippling-surface-2 text-rippling-ink-2'
        )}
      >
        {count}
      </span>
    </button>
  )
}

function FirstRunEmptyState({ onStart }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-white border-t border-rippling-line">
      <div className="max-w-md text-center px-6 py-12">
        <div className="mx-auto w-12 h-12 rounded-xl bg-rippling-chip text-rippling-plum flex items-center justify-center mb-4">
          <Layers size={20} strokeWidth={1.75} />
        </div>
        <h2 className="text-[16px] font-semibold text-rippling-ink mb-1.5">
          Your worklists will live here
        </h2>
        <p className="text-[13px] text-rippling-muted mb-5 leading-relaxed">
          Every bulk change you start is saved as a draft so you can finish it later, hand it off
          for approval, or keep an eye on changes you're an observer on.
        </p>
        <button
          onClick={onStart}
          className="h-9 pl-3 pr-4 rounded-md text-[13px] font-medium flex items-center gap-1.5 bg-rippling-plum text-white hover:bg-rippling-plum-hover shadow-sm mx-auto"
        >
          <Plus size={14} strokeWidth={2.25} />
          <span>Start a Bulk Change</span>
        </button>
      </div>
    </div>
  )
}
