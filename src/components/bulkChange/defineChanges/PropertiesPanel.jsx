import { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import PropertyRow from './PropertyRow'
import MemberPickerPopover from './MemberPickerPopover'
import { FIELDS_BY_KEY } from './fieldSchema'
import { avatarClass, classNames, initials } from '../../../lib/utils'

/**
 * Avatar pill for a person with "via {Field Label}" source chips.
 *
 * Auto-derived people show which field(s) caused their inclusion.
 * Manual people have a remove button instead.
 */
function PersonPill({ person, onRemove }) {
  const isAuto = person.source === 'auto'
  const sources = person.sources ?? []

  // Show at most 2 "via" chips inline; collapse the rest into "+N more"
  const visibleSources = sources.slice(0, 2)
  const hiddenSourceCount = sources.length - visibleSources.length

  return (
    <div className="flex items-start gap-2.5 py-2">
      {/* Avatar */}
      <div
        className={classNames(
          'h-8 w-8 rounded-full flex items-center justify-center text-white text-[11.5px] font-semibold shrink-0',
          avatarClass(person.name),
        )}
      >
        {initials(person.name)}
      </div>

      {/* Name + role + via chips */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-rippling-ink leading-tight truncate">
          {person.name}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
          {person.role && (
            <span className="text-[11.5px] text-rippling-muted">{person.role}</span>
          )}
          {isAuto && visibleSources.length > 0 && (
            <>
              {visibleSources.map((fieldKey) => {
                const label = FIELDS_BY_KEY.get(fieldKey)?.label
                return label ? (
                  <span
                    key={fieldKey}
                    className="inline-flex items-center h-5 px-1.5 rounded-full bg-rippling-chip text-rippling-plum text-[10.5px] font-medium whitespace-nowrap"
                    title={`Added because "${label}" is selected`}
                  >
                    via {label}
                  </span>
                ) : null
              })}
              {hiddenSourceCount > 0 && (
                <span
                  className="inline-flex items-center h-5 px-1.5 rounded-full bg-rippling-surface-2 text-rippling-muted text-[10.5px] font-medium whitespace-nowrap cursor-help"
                  title={sources
                    .slice(2)
                    .map((k) => FIELDS_BY_KEY.get(k)?.label ?? k)
                    .join(', ')}
                >
                  +{hiddenSourceCount} more
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Remove button — manual people only */}
      {!isAuto && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-1 h-5 w-5 rounded-full hover:bg-rippling-surface flex items-center justify-center text-rippling-muted hover:text-rippling-ink transition-colors shrink-0"
          aria-label={`Remove ${person.name}`}
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

/**
 * A labelled section with a list of PersonPills and an "add" button.
 */
function PeopleSection({ label, people, onAdd, onRemove, roleLabel }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const buttonRef = useRef(null)

  const excludeIds = new Set(people.map((p) => p.id))

  return (
    <PropertyRow label={label}>
      <div className="flex flex-col gap-0 relative">
        {people.length === 0 && (
          <span className="text-[12px] text-rippling-muted italic py-1">None</span>
        )}
        {people.map((person) => (
          <PersonPill
            key={person.id}
            person={person}
            onRemove={
              person.source === 'manual' ? () => onRemove(person.id) : undefined
            }
          />
        ))}

        {onAdd && (
          <div className="relative mt-0.5">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 h-6 pl-0.5 pr-2 rounded-full border border-dashed border-rippling-line hover:border-rippling-plum hover:bg-rippling-chip/30 text-rippling-muted hover:text-rippling-plum transition-colors text-[11.5px]"
              aria-label={`Add ${roleLabel}`}
              title={`Add ${roleLabel}`}
            >
              <span className="h-5 w-5 rounded-full border border-dashed border-current flex items-center justify-center shrink-0">
                <Plus size={10} strokeWidth={2} />
              </span>
              Add person
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
 * The stakeholders section of the right sidebar.
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
          <PersonPill person={{ ...lead, source: 'manual', sources: [] }} />
        ) : (
          <span className="text-[12px] text-rippling-muted italic">Unassigned</span>
        )}
      </PropertyRow>

      <PeopleSection
        label="Observers"
        roleLabel="observer"
        people={observers}
        onAdd={onAddObserver}
        onRemove={onRemoveObserver}
      />

      <PeopleSection
        label="Approvers"
        roleLabel="approver"
        people={approvers}
        onAdd={onAddApprover}
        onRemove={onRemoveApprover}
      />

      <PeopleSection
        label="Collaborators"
        roleLabel="collaborator"
        people={collaborators}
        onAdd={onAddCollaborator}
        onRemove={onRemoveCollaborator}
      />
    </div>
  )
}
