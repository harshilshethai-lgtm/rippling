import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Plus, X, FileText, Bell, Mail } from 'lucide-react'
import { classNames } from '../../../lib/utils'
import { COMMUNICATIONS_CONFIGS } from './followUpsConfig'

// ── Recipient chip colors ────────────────────────────────────────────────────

const RECIPIENT_STYLES = {
  Employee:    'bg-blue-50 text-blue-700 border-blue-200',
  'New Manager': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  HRBP:        'bg-purple-50 text-purple-700 border-purple-200',
  Manager:     'bg-amber-50 text-amber-700 border-amber-200',
}

const CHANNEL_OPTIONS    = ['Email', 'Rippling inbox', 'Slack']
const SEND_OPTIONS       = ['On commit', 'On effective date', 'On start date']
const SIGNATURE_OPTIONS  = ['Requires signature', 'Acknowledgment only', 'Informational', '—']

// ── All templates available for the "+ Add" picker ──────────────────────────

const ALL_EMAIL_TEMPLATES = [
  { id: 'comm.compLetter',        label: 'Manager comp summary for direct reports', recipients: ['New Manager'], channel: 'Email',           send: 'On commit',         signature: null },
  { id: 'comm.hrbpNotify',        label: 'HRBP cycle close-out',                    recipients: ['HRBP'],        channel: 'Email',           send: 'On commit',         signature: null },
  { id: 'comm.offerLetter',       label: 'Offer letter',                            recipients: ['Employee'],    channel: 'Email',           send: 'On effective date', signature: null },
  { id: 'comm.welcomeEmail',      label: 'Welcome to the team',                     recipients: ['Employee'],    channel: 'Email',           send: 'On effective date', signature: null },
]
const ALL_NOTIFICATION_TEMPLATES = [
  { id: 'comm.fyLetter',          label: 'Your FY26 letter is ready',               recipients: ['Employee'],    channel: 'Rippling inbox',  send: 'On effective date', signature: null },
  { id: 'comm.managerNotify',     label: 'You have a new direct report',            recipients: ['New Manager'], channel: 'Slack',           send: 'On effective date', signature: null },
  { id: 'comm.roleChange',        label: 'Your role has been updated',              recipients: ['Employee'],    channel: 'Rippling inbox',  send: 'On effective date', signature: null },
  { id: 'comm.locationChange',    label: 'Work location update',                    recipients: ['Employee'],    channel: 'Slack',           send: 'On commit',         signature: null },
]
const ALL_DOCUMENT_TEMPLATES = [
  { id: 'comm.totalCompStatement',label: 'Total Compensation Statement — FY26',     recipients: ['Employee'],    channel: 'Email',           send: 'On effective date', signature: 'Requires signature' },
  { id: 'comm.promotionLetter',   label: 'Promotion letter',                        recipients: ['Employee'],    channel: 'Email',           send: 'On effective date', signature: 'Requires signature' },
  { id: 'comm.compBandAck',       label: 'Compensation band acknowledgment',        recipients: ['Employee'],    channel: 'Email',           send: 'On commit',         signature: 'Acknowledgment only' },
  { id: 'comm.totalRewardsOverview', label: 'FY26 Total Rewards overview',          recipients: ['Employee', 'New Manager'], channel: 'Email', send: 'On commit',       signature: 'Informational' },
  { id: 'comm.employmentAgreement', label: 'Updated employment agreement',          recipients: ['Employee'],    channel: 'Email',           send: 'On effective date', signature: 'Requires signature' },
]

const TEMPLATE_CATALOG = {
  email:        ALL_EMAIL_TEMPLATES,
  notification: ALL_NOTIFICATION_TEMPLATES,
  document:     ALL_DOCUMENT_TEMPLATES,
}

// ── Tiny controlled <select> wrapper styled as a dropdown ────────────────────

function InlineSelect({ value, options, onChange, disabled, placeholder }) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={classNames(
          'appearance-none bg-transparent pr-5 text-[12.5px] font-medium cursor-pointer focus:outline-none',
          disabled ? 'text-rippling-muted cursor-default' : 'text-rippling-ink hover:text-rippling-plum',
        )}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={11} strokeWidth={2} className="pointer-events-none absolute right-0 text-rippling-muted" />
    </div>
  )
}

// ── Recipient chip(s) ────────────────────────────────────────────────────────

function RecipientChips({ recipients }) {
  return (
    <div className="flex flex-wrap gap-1">
      {recipients.map((r) => (
        <span
          key={r}
          className={classNames(
            'inline-flex items-center h-5 px-2 rounded-full border text-[11px] font-semibold',
            RECIPIENT_STYLES[r] ?? 'bg-rippling-surface-2 text-rippling-muted border-rippling-line',
          )}
        >
          {r}
        </span>
      ))}
    </div>
  )
}

// ── "+ Add" popover ───────────────────────────────────────────────────────────

function AddTemplatePicker({ type, existingIds, onAdd, onClose }) {
  const catalog = TEMPLATE_CATALOG[type] ?? []
  const available = catalog.filter((t) => !existingIds.has(t.id))

  return (
    <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-rippling-line py-1">
      {available.length === 0 ? (
        <p className="px-4 py-3 text-[12.5px] text-rippling-muted italic">All templates already added.</p>
      ) : (
        available.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { onAdd(t); onClose() }}
            className="w-full text-left px-4 py-2.5 hover:bg-rippling-surface transition-colors"
          >
            <p className="text-[12.5px] font-medium text-rippling-ink">{t.label}</p>
            <p className="text-[11px] text-rippling-muted mt-0.5">
              {t.recipients.join(', ')} · {t.channel}
            </p>
          </button>
        ))
      )}
    </div>
  )
}

// ── Table row ────────────────────────────────────────────────────────────────

function CommRow({ item, onChange, onRemove, reach, showSignature }) {
  const templateOptions = (TEMPLATE_CATALOG[item.commType] ?? []).map((t) => t.label)

  return (
    <div className="grid items-center gap-x-3 px-4 py-2.5 border-b border-rippling-line last:border-b-0 hover:bg-rippling-surface/40 transition-colors"
      style={{ gridTemplateColumns: showSignature
        ? '2fr 1fr 1fr 1fr 1.2fr auto'
        : '2fr 1fr 1fr 1fr auto'
      }}
    >
      {/* Template */}
      <InlineSelect
        value={item.label}
        options={templateOptions}
        onChange={(val) => {
          const found = (TEMPLATE_CATALOG[item.commType] ?? []).find((t) => t.label === val)
          if (found) onChange({ ...item, label: found.label })
        }}
      />

      {/* Recipients */}
      <RecipientChips recipients={item.recipients} />

      {/* Channel */}
      <InlineSelect
        value={item.channel}
        options={CHANNEL_OPTIONS}
        onChange={(val) => onChange({ ...item, channel: val })}
      />

      {/* Send */}
      <InlineSelect
        value={item.send}
        options={SEND_OPTIONS}
        onChange={(val) => onChange({ ...item, send: val })}
      />

      {/* Signature — only for documents */}
      {showSignature && (
        <InlineSelect
          value={item.signature ?? '—'}
          options={SIGNATURE_OPTIONS}
          onChange={(val) => onChange({ ...item, signature: val === '—' ? null : val })}
        />
      )}

      {/* Reach + remove */}
      <div className="flex items-center gap-2 justify-end">
        <span className="text-[12px] font-semibold text-rippling-ink tabular-nums whitespace-nowrap">
          {reach}
          <span className="text-[11px] font-normal text-rippling-muted ml-0.5">people</span>
        </span>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="text-rippling-muted hover:text-rippling-ink transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Remove"
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

function CommSection({
  type,
  icon: Icon,
  title,
  rightLabel,
  items,
  onChangeItem,
  onRemoveItem,
  onAddItem,
  computeReach,
  showSignature,
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef(null)
  const existingIds = useMemo(() => new Set(items.map((i) => i.id)), [items])

  useEffect(() => {
    if (!pickerOpen) return
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [pickerOpen])

  const colHeaders = showSignature
    ? ['TEMPLATE', 'RECIPIENTS', 'CHANNEL', 'SEND', 'SIGNATURE', '']
    : ['TEMPLATE', 'RECIPIENTS', 'CHANNEL', 'SEND', '']

  return (
    <div className="mb-6 last:mb-0">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-rippling-line bg-rippling-surface/60">
        <div className="flex items-center gap-1.5">
          <Icon size={13} strokeWidth={2} className="text-rippling-muted" />
          <span className="text-[11.5px] font-semibold text-rippling-muted tracking-wider uppercase">{title}</span>
        </div>
        <span className="text-[11px] text-rippling-muted">{rightLabel}</span>
      </div>

      {/* Column headers */}
      {items.length > 0 && (
        <div
          className="grid gap-x-3 px-4 py-1.5 border-b border-rippling-line/60"
          style={{ gridTemplateColumns: showSignature
            ? '2fr 1fr 1fr 1fr 1.2fr auto'
            : '2fr 1fr 1fr 1fr auto'
          }}
        >
          {colHeaders.map((h, i) => (
            <span key={i} className="text-[10.5px] font-semibold text-rippling-muted uppercase tracking-wider">
              {h}
            </span>
          ))}
        </div>
      )}

      {/* Rows */}
      <div className="group">
        {items.map((item) => (
          <CommRow
            key={item.id}
            item={item}
            onChange={onChangeItem}
            onRemove={onRemoveItem}
            reach={computeReach(item)}
            showSignature={showSignature}
          />
        ))}
      </div>

      {/* + Add button */}
      <div ref={pickerRef} className="relative inline-block mx-4 mt-2 mb-1">
        <button
          type="button"
          onClick={() => setPickerOpen((p) => !p)}
          className="flex items-center gap-1 text-[12px] font-medium text-rippling-plum hover:text-rippling-plum-hover transition-colors"
        >
          <Plus size={13} strokeWidth={2.5} />
          Add {type === 'email' ? 'email' : type === 'notification' ? 'notification' : 'document'}
        </button>
        {pickerOpen && (
          <AddTemplatePicker
            type={type}
            existingIds={existingIds}
            onAdd={(template) => onAddItem({ ...template, commType: type })}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function CommunicationsPanel({ items, onChange, selectedEmployeeCount = 0 }) {
  const emails        = items.filter((i) => i.commType === 'email')
  const notifications = items.filter((i) => i.commType === 'notification')
  const documents     = items.filter((i) => i.commType === 'document')

  const signaturesRequired = documents.filter(
    (d) => d.signature === 'Requires signature',
  ).reduce((sum, d) => sum + computeReach(d, selectedEmployeeCount), 0)

  function computeReach(item, empCount = selectedEmployeeCount) {
    if (item.recipients.includes('Employee')) return empCount
    if (item.recipients.includes('New Manager')) return Math.max(1, Math.round(empCount * 0.35))
    if (item.recipients.includes('HRBP')) return Math.max(1, Math.round(empCount * 0.07))
    return Math.max(1, Math.round(empCount * 0.2))
  }

  function handleChange(updated) {
    onChange(items.map((i) => (i.id === updated.id ? updated : i)))
  }

  function handleRemove(id) {
    onChange(items.filter((i) => i.id !== id))
  }

  function handleAdd(template) {
    const uid = `${template.id}_${Date.now()}`
    onChange([...items, { ...template, id: uid }])
  }

  const totalItems = items.length

  return (
    <div className="w-full">
      {/* Panel header */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-rippling-ink">Communications</h3>
          <p className="text-[12.5px] text-rippling-muted mt-0.5">
            Configure notifications, emails, and documents sent to affected parties.
          </p>
        </div>
        <span className="text-[11.5px] font-medium px-2.5 py-0.5 rounded-full bg-rippling-surface-2 text-rippling-muted shrink-0">
          {totalItems} item{totalItems !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Sections */}
      <div className="rounded-lg border border-rippling-line overflow-hidden">
        <CommSection
          type="email"
          icon={Mail}
          title="Emails"
          rightLabel="external delivery"
          items={emails}
          onChangeItem={handleChange}
          onRemoveItem={handleRemove}
          onAddItem={handleAdd}
          computeReach={(item) => computeReach(item)}
          showSignature={false}
        />

        <div className="border-t border-rippling-line" />

        <CommSection
          type="notification"
          icon={Bell}
          title="Notifications"
          rightLabel="in-product / Slack"
          items={notifications}
          onChangeItem={handleChange}
          onRemoveItem={handleRemove}
          onAddItem={handleAdd}
          computeReach={(item) => computeReach(item)}
          showSignature={false}
        />

        <div className="border-t border-rippling-line" />

        <CommSection
          type="document"
          icon={FileText}
          title="Documents"
          rightLabel={signaturesRequired > 0 ? `${signaturesRequired} signatures required` : 'no signatures required'}
          items={documents}
          onChangeItem={handleChange}
          onRemoveItem={handleRemove}
          onAddItem={handleAdd}
          computeReach={(item) => computeReach(item)}
          showSignature={true}
        />
      </div>

      {totalItems === 0 && (
        <p className="text-[13px] text-rippling-muted italic py-4 text-center">
          No communications configured for the selected properties.
        </p>
      )}
    </div>
  )
}
