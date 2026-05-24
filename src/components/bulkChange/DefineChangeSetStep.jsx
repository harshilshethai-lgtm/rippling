import { useMemo } from 'react'
import ChangeFieldsFilterBar from './defineChanges/ChangeFieldsFilterBar'
import PropertiesSidebar from './defineChanges/PropertiesSidebar'
import { useDerivedContext } from './defineChanges/useDerivedContext'
import { getDerivationKeysForFields } from './defineChanges/fieldSchema'

/**
 * Step 2 of the Bulk Change wizard — "Define change set".
 *
 * This page is intentionally focused: pick the fields you intend to edit
 * (and optionally seed Uniform/Unique mode + bulk defaults). No employee
 * table — that's the next page.
 *
 * Layout:
 *   • Left column (flex-1): composer + chip row. Empty-state shows the
 *     template gallery underneath; once chips appear they're listed with
 *     per-field Uniform/Unique toggles and the Modify (trim) button.
 *   • Right rail: PropertiesSidebar — derived observers, approvers, and
 *     process steps update live as fields are added/removed so the user
 *     can preview the consequences of their selection before editing
 *     values.
 *
 * State for fields, bulk values, mode, and manual people lives in the
 * parent (BulkChangePage) so the user can step forward to Make Changes
 * without losing context.
 */
export default function DefineChangeSetStep({
  lead,
  selectedFieldKeys,
  bulkValues,
  uniformByField,
  manualPeople,
  onAddFields,
  onApplyTemplate,
  onRemoveField,
  onRemoveFields,
  onChangeBulkValue,
  onToggleUniform,
  onAddObserver,
  onRemoveObserver,
  onAddApprover,
  onRemoveApprover,
  onAddCollaborator,
  onRemoveCollaborator,
}) {
  const derivationKeys = useMemo(
    () => getDerivationKeysForFields(selectedFieldKeys),
    [selectedFieldKeys],
  )
  const { observers, approvers, collaborators, steps } = useDerivedContext(
    derivationKeys,
    manualPeople,
  )

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-auto bg-rippling-surface">
        <div className="px-6 pt-5 pb-3 max-w-[920px] w-full mx-auto">
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold text-rippling-ink">
              What do you want to change?
            </h2>
            <p className="text-[12.5px] text-rippling-muted mt-0.5">
              Pick the fields to edit. Describe the scenario, pick a playbook
              with{' '}
              <kbd className="px-1 py-px rounded border border-rippling-line bg-white text-[10px] text-rippling-ink-2">
                /
              </kbd>
              , or add fields one-at-a-time with{' '}
              <kbd className="px-1 py-px rounded border border-rippling-line bg-white text-[10px] text-rippling-ink-2">
                @
              </kbd>
              . You'll set values for each employee on the next page.
            </p>
          </div>

          <ChangeFieldsFilterBar
            selectedFieldKeys={selectedFieldKeys}
            bulkValues={bulkValues}
            uniformByField={uniformByField}
            onAddFields={onAddFields}
            onApplyTemplate={onApplyTemplate}
            onRemoveField={onRemoveField}
            onRemoveFields={onRemoveFields}
            onChangeBulkValue={onChangeBulkValue}
            onToggleUniform={onToggleUniform}
            variant="expanded"
          />
        </div>
      </div>

      <PropertiesSidebar
        lead={lead}
        observers={observers}
        approvers={approvers}
        collaborators={collaborators}
        steps={steps}
        onAddObserver={onAddObserver}
        onRemoveObserver={onRemoveObserver}
        onAddApprover={onAddApprover}
        onRemoveApprover={onRemoveApprover}
        onAddCollaborator={onAddCollaborator}
        onRemoveCollaborator={onRemoveCollaborator}
      />
    </div>
  )
}
