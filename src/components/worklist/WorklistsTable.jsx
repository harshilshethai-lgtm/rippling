import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Trash2, Copy, FileText, Layers } from 'lucide-react'
import { avatarClass, classNames, initials } from '../../lib/utils'

const HEADER_CELL =
  'px-3 py-2.5 text-left font-semibold text-rippling-ink-2 text-[11px] uppercase tracking-wide border-r border-rippling-line bg-rippling-surface-2'

const BODY_CELL = 'px-3 py-2.5 align-middle'

const COLUMNS = [
  { key: 'name', label: 'Name', width: 'w-[260px]' },
  { key: 'status', label: 'Status', width: 'w-[155px]' },
  { key: 'intent', label: 'Intent', width: 'w-[180px]' },
  { key: 'role', label: 'Role', width: 'w-[110px]' },
  { key: 'peopleCount', label: 'People', width: 'w-[80px]' },
  { key: 'startTime', label: 'Start time', width: 'w-[130px]' },
  { key: 'lastModified', label: 'Last modified', width: 'w-[130px]' },
  { key: 'leadName', label: 'Lead', width: 'w-[180px]' },
  { key: 'approvers', label: 'Approvers', width: 'w-[160px]' },
  { key: 'actions', label: '', width: 'w-[44px]' },
]

const EMPTY_STATE_BY_BUCKET = {
  drafts: {
    title: 'No drafts yet',
    body: 'Start a Bulk Change from the People list and your draft will show up here.',
  },
  needsApproval: {
    title: 'Nothing waiting on approval',
    body: 'Worklists awaiting your approval — or yours awaiting others — will appear here.',
  },
  contributor: {
    title: 'Not a contributor yet',
    body: 'Worklists where you are an approver, observer, or collaborator will appear here.',
  },
  complete: {
    title: 'No completed worklists',
    body: 'Finished bulk changes will be archived here for reference.',
  },
}

export default function WorklistsTable({ entries, bucket, onDelete }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white border-t border-rippling-line">
      <div className="flex-1 overflow-auto">
        <table className="people-table w-full text-[13px] border-collapse">
          <thead className="sticky top-0 z-10 shadow-[0_1px_0_0_#E5E5E5,0_2px_6px_rgba(15,15,15,0.04)]">
            <tr className="border-b-2 border-rippling-line">
              {COLUMNS.map((col, i) => (
                <th
                  key={col.key}
                  className={classNames(
                    col.width,
                    HEADER_CELL,
                    i === COLUMNS.length - 1 && 'border-r-0'
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white">
            {entries.map((entry) => (
              <WorklistRow key={entry.id} entry={entry} onDelete={onDelete} />
            ))}

            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-3 py-20 text-center text-rippling-muted"
                >
                  <EmptyState bucket={bucket} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function WorklistRow({ entry, onDelete }) {
  return (
    <tr className="border-b border-rippling-line-2 data-row hover:bg-rippling-surface">
      <td className={BODY_CELL}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-rippling-chip text-rippling-plum flex items-center justify-center flex-shrink-0">
            <Layers size={14} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-rippling-ink truncate">{entry.name}</div>
            <div className="text-[11.5px] text-rippling-muted truncate">
              {stepLabel(entry.step)}
            </div>
          </div>
        </div>
      </td>

      <td className={BODY_CELL}>
        <StatusPill status={entry.status} />
      </td>

      <td className={classNames(BODY_CELL, 'text-rippling-ink-2 truncate')}>
        {entry.intent || <span className="text-rippling-muted italic">—</span>}
      </td>

      <td className={BODY_CELL}>
        <RolePill role={entry.role} />
      </td>

      <td className={classNames(BODY_CELL, 'text-rippling-ink-2 tabular-nums')}>
        {entry.peopleCount}
      </td>

      <td
        className={classNames(BODY_CELL, 'text-rippling-ink-2')}
        title={formatAbsolute(entry.startTime)}
      >
        {formatRelative(entry.startTime)}
      </td>

      <td
        className={classNames(BODY_CELL, 'text-rippling-ink-2')}
        title={formatAbsolute(entry.lastModified)}
      >
        {formatRelative(entry.lastModified)}
      </td>

      <td className={BODY_CELL}>
        <PersonChip name={entry.leadName} />
      </td>

      <td className={BODY_CELL}>
        <ApproverStack approvers={entry.approvers} />
      </td>

      <td className={BODY_CELL}>
        <RowMenu entry={entry} onDelete={onDelete} />
      </td>
    </tr>
  )
}

function stepLabel(step) {
  switch (step) {
    case 'select':
      return 'Selecting people'
    case 'changes':
      return 'Defining changes'
    case 'review':
      return 'Ready for review'
    default:
      return '—'
  }
}

function StatusPill({ status }) {
  const styles = {
    Draft: 'bg-rippling-surface-2 text-rippling-ink-2 border-rippling-line',
    'Needs approval': 'bg-amber-50 text-amber-700 border-amber-200',
    'In progress': 'bg-blue-50 text-blue-700 border-blue-200',
    Complete: 'bg-green-50 text-green-700 border-green-200',
  }
  const dot = {
    Draft: 'bg-rippling-muted',
    'Needs approval': 'bg-amber-500',
    'In progress': 'bg-blue-500',
    Complete: 'bg-green-500',
  }
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap',
        styles[status] || 'bg-gray-50 text-gray-700 border-gray-200'
      )}
    >
      <span
        className={classNames('w-1.5 h-1.5 rounded-full shrink-0', dot[status] || 'bg-gray-400')}
      />
      <span>{status}</span>
    </span>
  )
}

function RolePill({ role }) {
  const styles = {
    Lead: 'bg-rippling-chip text-rippling-plum',
    Approver: 'bg-blue-50 text-blue-700',
    Observer: 'bg-rippling-surface-2 text-rippling-ink-2',
    Collaborator: 'bg-rippling-surface-2 text-rippling-ink-2',
  }
  return (
    <span
      className={classNames(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap',
        styles[role] || 'bg-rippling-surface-2 text-rippling-ink-2'
      )}
    >
      {role}
    </span>
  )
}

function PersonChip({ name }) {
  if (!name) return <span className="text-rippling-muted italic">—</span>
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className={classNames(
          'w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0',
          avatarClass(name)
        )}
      >
        {initials(name)}
      </div>
      <span className="text-rippling-ink-2 truncate">{name}</span>
    </div>
  )
}

function ApproverStack({ approvers }) {
  if (!approvers || approvers.length === 0) {
    return <span className="text-rippling-muted italic text-[12px]">No approvers</span>
  }
  const shown = approvers.slice(0, 3)
  const extra = approvers.length - shown.length

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex -space-x-1.5">
        {shown.map((p, i) => (
          <div
            key={`${p.name}-${i}`}
            title={p.name}
            className={classNames(
              'w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold ring-2 ring-white',
              avatarClass(p.name)
            )}
          >
            {initials(p.name)}
          </div>
        ))}
      </div>
      <span className="text-[12px] text-rippling-muted truncate">
        {approvers.length} {approvers.length === 1 ? 'reviewer' : 'reviewers'}
        {extra > 0 && ` (+${extra})`}
      </span>
    </div>
  )
}

function RowMenu({ entry, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((o) => !o)
        }}
        aria-label="Worklist actions"
        className="h-7 w-7 rounded-md ui-interactive text-rippling-muted hover:text-rippling-ink-2 flex items-center justify-center"
      >
        <MoreHorizontal size={15} strokeWidth={1.75} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-44 rounded-md border border-rippling-line bg-white shadow-rippling-dropdown z-20 py-1"
        >
          <MenuItem
            icon={FileText}
            label="Open details"
            onClick={() => setOpen(false)}
            disabled
          />
          <MenuItem icon={Copy} label="Duplicate" onClick={() => setOpen(false)} disabled />
          <div className="my-1 border-t border-rippling-line-2" />
          <MenuItem
            icon={Trash2}
            label="Delete"
            destructive
            onClick={() => {
              setOpen(false)
              onDelete?.(entry.id)
            }}
          />
        </div>
      )}
    </div>
  )
}

function MenuItem({ icon: Icon, label, onClick, disabled, destructive }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        'flex items-center gap-2 w-full px-2.5 py-1.5 text-[12.5px] text-left',
        disabled && 'text-rippling-muted cursor-not-allowed',
        !disabled && destructive && 'text-red-600 hover:bg-red-50',
        !disabled && !destructive && 'text-rippling-ink-2 hover:bg-rippling-surface'
      )}
    >
      <Icon size={13} strokeWidth={1.75} />
      <span>{label}</span>
    </button>
  )
}

function EmptyState({ bucket }) {
  const meta = EMPTY_STATE_BY_BUCKET[bucket] ?? EMPTY_STATE_BY_BUCKET.drafts
  return (
    <div className="max-w-sm mx-auto">
      <div className="mx-auto w-10 h-10 rounded-full bg-rippling-chip text-rippling-plum flex items-center justify-center mb-3">
        <Layers size={16} strokeWidth={1.75} />
      </div>
      <div className="text-[13.5px] font-medium text-rippling-ink mb-1">{meta.title}</div>
      <div className="text-[12.5px] text-rippling-muted leading-relaxed">{meta.body}</div>
    </div>
  )
}

// ─── Time formatters ────────────────────────────────────────────────────────

function formatRelative(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const sec = Math.round(diffMs / 1000)
  if (sec < 60) return 'Just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day}d ago`
  const month = Math.round(day / 30)
  if (month < 12) return `${month}mo ago`
  const year = Math.round(month / 12)
  return `${year}y ago`
}

function formatAbsolute(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return ''
  }
}
