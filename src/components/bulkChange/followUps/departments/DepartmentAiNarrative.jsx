import { Sparkles } from 'lucide-react'

/**
 * Domain-scoped AI narrative card at the top of the Department Panel.
 * Answers the domain owner's first question: "why am I being interrupted?"
 *
 * Mirrors PreviewAiSummary but framed from the domain owner's mental model —
 * what's hitting their domain, and what will their team need to do about it.
 */
function buildDomainNarrative({ department, criticalCount, highCount, mediumCount, humanTaskCount, autoTaskCount, totalTriggered }) {
  const deptLabel = department.label

  if (totalTriggered === 0) {
    const taskLine = humanTaskCount > 0
      ? `Your team picks up ${humanTaskCount} task${humanTaskCount === 1 ? '' : 's'} on commit (${autoTaskCount} automated).`
      : `${autoTaskCount} automated task${autoTaskCount === 1 ? '' : 's'} will run on commit — no manual action needed from your team.`
    return {
      headline: `No flagged issues in ${deptLabel} — but there's follow-up work.`,
      body: taskLine,
      chips: ['No flags', `${humanTaskCount} tasks`],
    }
  }

  const flagParts = []
  if (criticalCount > 0) flagParts.push(`${criticalCount} critical`)
  if (highCount > 0) flagParts.push(`${highCount} high`)
  if (mediumCount > 0) flagParts.push(`${mediumCount} medium`)
  const flagSummary = flagParts.join(' · ')

  let headline = ''
  if (criticalCount > 0) {
    headline = `${deptLabel} has ${criticalCount} blocker${criticalCount === 1 ? '' : 's'} that need your sign-off before this commits.`
  } else if (highCount > 0) {
    headline = `${deptLabel} has ${highCount} high-priority issue${highCount === 1 ? '' : 's'} to review before commit.`
  } else {
    headline = `${deptLabel} has ${totalTriggered} item${totalTriggered === 1 ? '' : 's'} flagged — medium risk or below.`
  }

  const bodyParts = []
  bodyParts.push(`${flagSummary} ${totalTriggered === 1 ? 'event was' : 'events were'} routed to ${deptLabel} because they cross your domain's thresholds.`)
  if (humanTaskCount > 0) {
    bodyParts.push(`On commit, your team picks up ${humanTaskCount} task${humanTaskCount === 1 ? '' : 's'} that need attention (${autoTaskCount} more run automatically).`)
  } else if (autoTaskCount > 0) {
    bodyParts.push(`${autoTaskCount} automated task${autoTaskCount === 1 ? '' : 's'} will run on commit — no manual action needed.`)
  }

  const chips = []
  if (criticalCount > 0) chips.push(`${criticalCount} critical`)
  if (highCount > 0) chips.push(`${highCount} high`)
  if (humanTaskCount > 0) chips.push(`${humanTaskCount} tasks`)

  return { headline, body: bodyParts.join(' '), chips }
}

export default function DepartmentAiNarrative({
  department,
  triggeredEvents,
  humanTaskCount,
  autoTaskCount,
}) {
  const criticalCount = triggeredEvents.filter((e) => e.source.tier === 'critical' && e.entry?.triggered).length
  const highCount = triggeredEvents.filter((e) => e.source.tier === 'high' && e.entry?.triggered).length
  const mediumCount = triggeredEvents.filter((e) => e.source.tier === 'medium' && e.entry?.triggered).length
  const totalTriggered = triggeredEvents.filter((e) => e.entry?.triggered).length

  const { headline, body, chips } = buildDomainNarrative({
    department,
    criticalCount,
    highCount,
    mediumCount,
    humanTaskCount,
    autoTaskCount,
    totalTriggered,
  })

  return (
    <div className="bg-white rounded-xl border border-rippling-line shadow-rippling-card px-5 py-4 mb-5">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles size={13} strokeWidth={1.75} className="text-rippling-plum shrink-0" />
        <span className="text-[10.5px] font-semibold text-rippling-muted uppercase tracking-wider">
          AI Domain Summary
        </span>
      </div>

      <p className="text-[15px] font-semibold text-rippling-ink leading-snug mb-1.5">
        {headline}
      </p>

      {body && (
        <p className="text-[12.5px] text-rippling-ink-2 leading-relaxed mb-3">
          {body}
        </p>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center h-6 px-2.5 rounded-full bg-rippling-chip border border-rippling-line text-[11.5px] font-medium text-rippling-ink-2"
            >
              {chip}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
