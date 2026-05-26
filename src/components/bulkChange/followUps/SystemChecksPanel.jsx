import FollowUpChecklist from './FollowUpChecklist'

/**
 * System Checks substep panel.
 *
 * Wraps the generic FollowUpChecklist for the System Checks substep.
 * Validation failures expose the affected employees list + Edit link;
 * probe failures expose a Re-run button.
 */
export default function SystemChecksPanel({ items, statuses, onRerun, onEditAffected }) {
  return (
    <FollowUpChecklist
      title="System checks"
      description="Validates data integrity and system readiness before writing any changes."
      items={items}
      statuses={statuses}
      onRerun={onRerun}
      onEditAffected={onEditAffected}
    />
  )
}
