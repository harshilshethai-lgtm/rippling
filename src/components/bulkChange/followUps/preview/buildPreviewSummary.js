/**
 * Generates a canned AI pre-flight summary from aggregated preview state.
 *
 * Returns { headline: string, body: string, chips: string[] }
 */
export function buildAiSummary({ aggregate, totalEmployees, topCategories }) {
  const { critical = 0, high = 0, medium = 0, routine = 0 } = aggregate
  const total = critical + high + medium + routine

  if (total === 0) {
    return {
      headline: 'Looking clean — no events flagged.',
      body: `You're about to apply changes to ${totalEmployees} employee${totalEmployees === 1 ? '' : 's'}. No risk events were detected.`,
      chips: [],
    }
  }

  const things = []
  if (critical > 0) things.push(`${critical} critical event${critical === 1 ? '' : 's'} need${critical === 1 ? 's' : ''} a reviewer`)
  if (high > 0) things.push(`${high} high event${high === 1 ? '' : 's'} need${high === 1 ? 's' : ''} a reviewer`)
  if (medium > 0) things.push(`${medium} medium event${medium === 1 ? '' : 's'} worth reviewing`)

  const thingCount = things.length
  let headline = ''
  if (critical > 0) {
    headline = `A wide-impact change with ${thingCount} thing${thingCount === 1 ? '' : 's'} worth a second look.`
  } else if (high > 0) {
    headline = `Mostly straightforward — ${high} item${high === 1 ? '' : 's'} need${high === 1 ? 's' : ''} a reviewer.`
  } else {
    headline = `Mostly routine — ${medium} item${medium === 1 ? '' : 's'} to review before you ship.`
  }

  const bodyParts = []
  if (totalEmployees > 0) {
    bodyParts.push(`You're moving ${totalEmployees} employee${totalEmployees === 1 ? '' : 's'} across ${topCategories.length || 1} domain${topCategories.length === 1 ? '' : 's'}.`)
  }
  if (things.length > 0) {
    bodyParts.push(`Most of this is routine, but I'd flag ${things.join(', ')}.`)
  }

  return { headline, body: bodyParts.join(' '), chips: topCategories.slice(0, 4) }
}
