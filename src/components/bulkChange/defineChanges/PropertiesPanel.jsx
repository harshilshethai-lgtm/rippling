import { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import MemberPickerPopover from './MemberPickerPopover'
import { FIELDS_BY_KEY } from './fieldSchema'
import { avatarClass, classNames, initials } from '../../../lib/utils'

/**
 * Avatar pill for a stakeholder. Compact enough to stack tightly.
 * Layout: [avatar] [name · role · via chips]  [remove ×]
 */
function PersonPill({ person, onRemove }) {
  const isAuto = person.source === 'auto'
  const sources = person.sources ?? []
  const visibleSources = sources.slice(0, 2)
  const hiddenSourceCount = sources.length - visibleSources.length

  return (
    <div className="flex items-center gap-2 py-1.5 min-w-0">
      <div
        className={classNames(
          'h-7 w-7 rounded-full flex items-center justify-center text-white text-[10.5px] font-semibold shrink-0',
          avatarClass(person.name),
        )}
      >
        {initials(person.name)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1 min-w-0 flex-wrap">
          <span className="text-[12.5px] font-medium text-rippling-ink leading-tight truncate">
            {person.name}
          </span>
          {person.role && (
            <span className="text-[11px] text-rippling-muted leading-tight whitespace-nowrap">
              {person.role}
            </span>
          )}
        </div>

        {isAuto && visibleSources.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mt-0.5">
            {visibleSources.map((fieldKey) => {
              const label = FIELDS_BY_KEY.get(fieldKey)?.label
              return label ? (
                <span
                  key={fieldKey}
                  className="inline-flex items-center h-4 px-1.5 rounded-full bg-rippling-chip text-rippling-plum text-[10px] font-medium whitespace-nowrap"
                  title={`Added because "${label}" is selected`}
                >
                  via {label}
                </span>
              ) : null
            })}
            {hiddenSourceCount > 0 && (
              <span
                className="inline-flex items-center h-4 px-1.5 rounded-full bg-rippling-surface-2 text-rippling-muted text-[10px] font-medium whitespace-nowrap cursor-help"
                title={sources
                  .slice(2)
                  .map((k) => FIELDS_BY_KEY.get(k)?.label ?? k)
                  .join(', ')}
              >
                +{hiddenSourceCount} more
              </span>
            )}
          </div>
        )}
      </div>

      {!isAuto && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="h-5 w-5 rounded-full hover:bg-rippling-surface flex items-center justify-center text-rippling-muted hover:text-rippling-ink transition-colors shrink-0"
          aria-label={`Remove ${person.name}`}
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

/**
 * A stakeholder section with a top label, stacked PersonPills, and
 * an "add" button. All sections share the same left edge.
 */
function StakeholderSection({ label, people, onAdd, roleLabel }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const buttonRef = useRef(null)
  const excludeIds = new Set(people.map((p) => p.id))

  return (
    <div className="py-3 border-b border-rippling-line-2 last:border-b-0">
      {/* Top label row */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[10.5px] font-semibold text-rippling-muted uppercase tracking-wide">
          {label}
        </span>
        {people.length > 0 && (
          <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-rippling-surface-2 text-rippling-muted text-[10px] font-medium tabular-nums">
            {people.length}
          </span>
        )}
      </div>

      {/* People list */}
      {people.length === 0 && (
        <span className="block text-[12px] text-rippling-muted italic py-0.5 pl-0.5">
          None
        </span>
      )}
      <div className="flex flex-col">
        {people.map((person) => (
          <PersonPill
            key={person.id}
            person={person}
            onRemove={
              person.source === 'manual'
                ? () => {
                    /* handled via onRemove prop passed in from parent */
                  }
                : undefined
            }
          />
        ))}
      </div>

      {/* Add button */}
      {onAdd && (
        <div className="mt-1 relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 h-6 pl-0.5 pr-2.5 rounded-full border border-dashed border-rippling-line hover:border-rippling-plum hover:bg-rippling-chip/30 text-rippling-muted hover:text-rippling-plum transition-colors text-[11.5px]"
            aria-label={`Add ${roleLabel}`}
          >
            <span className="h-5 w-5 rounded-full border border-dashed border-current flex items-center justify-center shrink-0">
              <Plus size={9} strokeWidth={2} />
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
  )
}

/**
 * This is a thin wrapper that re-binds onRemove to the actual prop function
 * (since StakeholderSection's inline closure can't capture it cleanly).
 * We keep PeopleSection as the real render logic here.
 */
function PeopleSection({ label, roleLabel, people, onAdd, onRemove }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const buttonRef = useRef(null)
  const excludeIds = new Set(people.map((p) => p.id))

  return (
    <div className="py-3 border-b border-rippling-line-2 last:border-b-0">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[10.5px] font-semibold text-rippling-muted uppercase tracking-wide">
          {label}
        </span>
        {people.length > 0 && (
          <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-rippling-surface-2 text-rippling-muted text-[10px] font-medium tabular-nums">
            {people.length}
          </span>
        )}
      </div>

      {people.length === 0 && (
        <span className="block text-[12px] text-rippling-muted italic py-0.5">None</span>
      )}

      <div className="flex flex-col">
        {people.map((person) => (
          <PersonPill
            key={person.id}
            person={person}
            onRemove={person.source === 'manual' ? () => onRemove?.(person.id) : undefined}
          />
        ))}
      </div>

      {onAdd && (
        <div className="mt-1 relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 h-6 pl-0.5 pr-2.5 rounded-full border border-dashed border-rippling-line hover:border-rippling-plum hover:bg-rippling-chip/30 text-rippling-muted hover:text-rippling-plum transition-colors text-[11.5px]"
            aria-label={`Add ${roleLabel}`}
          >
            <span className="h-5 w-5 rounded-full border border-dashed border-current flex items-center justify-center shrink-0">
              <Plus size={9} strokeWidth={2} />
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
  )
}

/**
 * Stakeholders section of the right sidebar.
 * Uses top-label layout: section label above the people list, consistent
 * left-edge alignment across all groups.
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
    <div className="px-4 py-2">
      {/* Lead — fixed, no picker */}
      <div className="py-3 border-b border-rippling-line-2">
        <div className="mb-1.5">
          <span className="text-[10.5px] font-semibold text-rippling-muted uppercase tracking-wide">
            Lead
          </span>
        </div>
        {lead ? (
          <PersonPill person={{ ...lead, source: 'manual', sources: [] }} />
        ) : (
          <span className="block text-[12px] text-rippling-muted italic">Unassigned</span>
        )}
      </div>

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
