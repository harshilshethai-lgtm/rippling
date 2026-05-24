import { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import PropertyRow from './PropertyRow'
import MemberPickerPopover from './MemberPickerPopover'
import { avatarClass, classNames, initials } from '../../../lib/utils'

/**
 * Avatar pill for a person with optional remove button.
 * Auto-derived people have no remove button.
 */
function PersonPill({ person, onRemove }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 h-6 pl-0.5 pr-1.5 rounded-full text-[11.5px] font-medium',
        'bg-rippling-surface-2 border border-rippling-line text-rippling-ink-2',
        'transition-colors',
        person.source === 'auto' && 'border-rippling-chip bg-rippling-chip/40',
      )}
      title={`${person.name}${person.role ? ` · ${person.role}` : ''}`}
    >
      <span
        className={classNames(
          'h-5 w-5 rounded-full flex items-center justify-center text-[9.5px] font-semibold text-white shrink-0',
          avatarClass(person.name),
        )}
      >
        {initials(person.name)}
      </span>
      <span className="truncate max-w-[80px]">{person.name.split(' ')[0]}</span>
      {person.source === 'auto' && (
        <span className="text-[9px] font-semibold text-rippling-plum/70 uppercase tracking-wide ml-0.5">
          Auto
        </span>
      )}
      {person.source === 'manual' && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 h-3.5 w-3.5 rounded-full hover:bg-rippling-elevated flex items-center justify-center text-rippling-muted hover:text-rippling-ink transition-colors"
          aria-label={`Remove ${person.name}`}
        >
          <X size={8} strokeWidth={2.5} />
        </button>
      )}
    </span>
  )
}

/**
 * A row with a list of person pills + "add" button.
 */
function PeopleRow({ label, people, onAdd, onRemove, roleLabel }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const buttonRef = useRef(null)

  const excludeIds = new Set(people.map((p) => p.id))

  return (
    <PropertyRow label={label}>
      <div className="flex flex-wrap gap-1 items-center relative">
        {people.length === 0 && (
          <span className="text-[12px] text-rippling-muted italic">None</span>
        )}
        {people.map((person) => (
          <PersonPill
            key={person.id}
            person={person}
            onRemove={person.source === 'manual' ? () => onRemove(person.id) : undefined}
          />
        ))}

        {/* Add button */}
        {onAdd && (
          <div className="relative">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="h-6 w-6 rounded-full border border-dashed border-rippling-line hover:border-rippling-plum hover:bg-rippling-chip/30 flex items-center justify-center text-rippling-muted hover:text-rippling-plum transition-colors"
              aria-label={`Add ${roleLabel}`}
              title={`Add ${roleLabel}`}
            >
              <Plus size={11} strokeWidth={2} />
            </button>

            {pickerOpen && (
              <MemberPickerPopover
                anchorRef={buttonRef}
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
    </PropertyRow>
  )
}

/**
 * The "Properties" section of the right sidebar.
 * Shows Lead, Observers, Approvers, and Collaborators.
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
    <div className="px-4 py-3 space-y-0.5">
      {/* Lead — fixed, no picker */}
      <PropertyRow label="Lead">
        {lead ? (
          <PersonPill person={{ ...lead, source: 'manual' }} />
        ) : (
          <span className="text-[12px] text-rippling-muted italic">Unassigned</span>
        )}
      </PropertyRow>

      <PeopleRow
        label="Observers"
        roleLabel="observer"
        people={observers}
        onAdd={onAddObserver}
        onRemove={onRemoveObserver}
      />

      <PeopleRow
        label="Approvers"
        roleLabel="approver"
        people={approvers}
        onAdd={onAddApprover}
        onRemove={onRemoveApprover}
      />

      <PeopleRow
        label="Collaborators"
        roleLabel="collaborator"
        people={collaborators}
        onAdd={onAddCollaborator}
        onRemove={onRemoveCollaborator}
      />
    </div>
  )
}
