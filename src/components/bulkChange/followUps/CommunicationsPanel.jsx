import FollowUpChecklist from './FollowUpChecklist'

/**
 * Communications substep panel — the final substep, always present.
 * Items are filtered comm configs from followUpsConfig.js.
 */
export default function CommunicationsPanel({ items, statuses, onRerun }) {
  return (
    <FollowUpChecklist
      title="Communications"
      description="Sends notifications, documents, and announcements to affected parties."
      items={items}
      statuses={statuses}
      onRerun={onRerun}
    />
  )
}
