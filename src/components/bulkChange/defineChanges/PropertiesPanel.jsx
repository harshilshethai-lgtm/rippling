import { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import MemberPickerPopover from './MemberPickerPopover'
import { FIELDS_BY_KEY } from './fieldSchema'
import { avatarClass, classNames, initials } from '../../../lib/utils'

/**
 * Small avatar + name chip used in the linear compact rows.
 * Shows a remove × on hover for manually-added people.
 * Auto-derived people show their source fields as a tooltip.
 */
function PersonChip({ person, onRemove }) {
  const isAuto = person.source === 'auto'
  const viaLabel = person.sources
    ?.map((k) => FIELDS_BY_KEY.get(k)?.label)
    .filter(Boolean)
    .join(', ')

  return (
    <div
      className="group/chip flex items-center gap-1"
      title={isAuto && viaLabel ? `Auto-added via ${viaLabel}` : undefined}
    >
      <div
        className={classNames(
          'h-5 w-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold shrink-0',
          avatarClass(person.name),
        )}
      >
        {initials(person.name)}
      </div>
      <span className="text-[11.5px] text-rippling-ink-2 leading-none">{person.name}</span>
      {!isAuto && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="opacity-0 group-hover/chip:opacity-100 ml-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center text-rippling-muted hover:text-rippling-ink transition-all"
          aria-label={`Remove ${person.name}`}
        >
          <X size={8} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

/**
 * One horizontal row: [Label]  [chip] [chip] … [+ circle]
 * The + circle is inline after the last person, not on a new line.
 */
function LinearRow({ label, people, onAdd, onRemove, roleLabel }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const addBtnRef = useRef(null)
  const excludeIds = new Set(people.map((p) => p.id))

  return (
    <div className="flex items-center gap-2 min-h-[28px] py-1">
      <span className="text-[11px] text-rippling-muted shrink-0 w-[80px]">{label}</span>
      <div className="flex-1 flex items-center flex-wrap gap-x-2.5 gap-y-1">
        {people.map((person) => (
          <PersonChip
            key={person.id}
            person={person}
            onRemove={
              person.source === 'manual' && onRemove ? () => onRemove(person.id) : undefined
            }
          />
        ))}

        {onAdd && (
          <div className="relative">
            <button
              ref={addBtnRef}
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="h-5 w-5 rounded-full border border-dashed border-rippling-line flex items-center justify-center text-rippling-muted hover:border-rippling-plum hover:text-rippling-plum transition-colors"
              aria-label={`Add ${roleLabel}`}
              title={`Add ${roleLabel}`}
            >
              <Plus size={9} strokeWidth={2} />
            </button>
            {pickerOpen && (
              <MemberPickerPopover
                anchorRef={addBtnRef}
                excludeIds={excludeIds}
                onSelect={(person) => {
                  onAdd(person)
                  setPickerOpen(false)
                }}
                onClose={() => setPickerOpen(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Stakeholders panel — Linear-style compact horizontal rows.
 * Each row: label + avatar chips + inline + button, all on one line.
 */
export default function PropertiesPanel({
  lead,
  observers,
  approvers,
  collaborators,
  onAddObserver,
  onRemoveObserver,
  onAddApprover,
  onRemoveApprover,
  onAddCollaborator,
  onRemoveCollaborator,
}) {
  return (
    <div className="px-4 pb-3 pt-1 flex flex-col">
      {/* Lead — fixed, no picker */}
      <div className="flex items-center gap-2 min-h-[28px] py-1">
        <span className="text-[11px] text-rippling-muted shrink-0 w-[80px]">Lead</span>
        <div className="flex-1">
          {lead ? (
            <PersonChip person={{ ...lead, source: 'fixed', sources: [] }} />
          ) : (
            <span className="text-[11.5px] text-rippling-muted italic">Unassigned</span>
          )}
        </div>
      </div>

      <LinearRow
        label="Observers"
        roleLabel="observer"
        people={observers}
        onAdd={onAddObserver}
        onRemove={onRemoveObserver}
      />

      <LinearRow
        label="Approvers"
        roleLabel="approver"
        people={approvers}
        onAdd={onAddApprover}
        onRemove={onRemoveApprover}
      />

      <LinearRow
        label="Collaborators"
        roleLabel="collaborator"
        people={collaborators}
        onAdd={onAddCollaborator}
        onRemove={onRemoveCollaborator}
      />
    </div>
  )
}
