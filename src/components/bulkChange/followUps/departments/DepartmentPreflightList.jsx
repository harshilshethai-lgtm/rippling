import ChecklistItem from '../ChecklistItem'
import { useDepartmentPreflightRunner } from './useDepartmentPreflightRunner'

/**
 * Zone 1 — the always-shown automated pre-flight checks for a department
 * panel. Reuses the existing ChecklistItem so visual treatment matches the
 * top-level System Checks panel 1:1.
 *
 * Always renders something: when there are no probes for this department
 * (which the design contract says shouldn't happen but we guard anyway), a
 * tasteful empty state is shown.
 */
export default function DepartmentPreflightList({ deptId, items }) {
  // panelKey forces the runner to restart whenever the user switches
  // departments. Tying it to deptId is enough because items is stable per
  // department (only the field-augment additions vary across selections,
  // but those don't change while the user is on the panel).
  const panelKey = `${deptId}:${items.map((i) => i.id).join(',')}`

  const { statuses, rerun } = useDepartmentPreflightRunner({
    items,
    panelKey,
  })

  if (!items || items.length === 0) {
    return (
      <p className="text-[12.5px] text-rippling-muted italic text-center py-4">
        No automated pre-checks for this department on the current change.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <ChecklistItem
            item={item}
            statusEntry={statuses.get(item.id)}
            onRerun={rerun}
          />
        </li>
      ))}
    </ul>
  )
}
