import { useCallback } from 'react'
import ChangeFieldsFilterBar from './defineChanges/ChangeFieldsFilterBar'
import PropertiesSidebar from './defineChanges/PropertiesSidebar'
import { useDerivedContext } from './defineChanges/useDerivedContext'

/**
 * Step 2 of the Bulk Change wizard — "Define change set".
 *
 * Property selection is the only JTBD on this page. Selected properties
 * sit at the top as chips, with primary "+ Add property" and secondary
 * "Ask AI" / "Browse templates" affordances below. The Uniform/Unique
 * decision and per-property values live on the next page (Make changes).
 *
 * State for fields, bulk values, mode, and manual people lives in the
 * parent (BulkChangePage) so the user can step forward without losing
 * context.
 */
export default function DefineChangeSetStep({
  lead,
  selectedFieldKeys,
  bulkValues,
  manualPeople,
  onAddFields,
  onApplyTemplate,
  onRemoveField,
  onRemoveFields,
  onAddObserver,
  onRemoveObserver,
  onAddApprover,
  onRemoveApprover,
  onAddCollaborator,
  onRemoveCollaborator,
}) {
  const { observers, approvers, collaborators, steps } = useDerivedContext(
    selectedFieldKeys,
    manualPeople,
  )

  const handleClearAll = useCallback(() => {
    if (selectedFieldKeys.length === 0) return
    onRemoveFields?.(selectedFieldKeys)
  }, [selectedFieldKeys, onRemoveFields])

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-auto bg-rippling-surface">
        <div className="px-6 pt-8 pb-8 max-w-[720px] w-full mx-auto">
          <div className="mb-6 text-center">
            <h2 className="text-[17px] font-semibold text-rippling-ink tracking-tight">
              Define change set
            </h2>
            <p className="text-[13px] text-rippling-muted mt-1">
              Pick the properties to edit — you&apos;ll set values for each
              employee on the next step.
            </p>
          </div>

          <ChangeFieldsFilterBar
            selectedFieldKeys={selectedFieldKeys}
            bulkValues={bulkValues}
            onAddFields={onAddFields}
            onApplyTemplate={onApplyTemplate}
            onRemoveField={onRemoveField}
            onRemoveFields={onRemoveFields}
            onClearAll={handleClearAll}
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
