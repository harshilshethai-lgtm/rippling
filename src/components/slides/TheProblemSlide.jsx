function QuadrantCard({ label, lines }) {
  return (
    <div className="p-7">
      <p className="text-[10.5px] font-bold tracking-widest uppercase text-rippling-plum mb-3.5">
        {label}
      </p>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <p
            key={i}
            className={
              line.highlight
                ? 'text-[13.5px] leading-snug text-rippling-ink font-semibold'
                : 'text-[13.5px] leading-snug text-rippling-ink-2'
            }
          >
            {line.text}
          </p>
        ))}
      </div>
    </div>
  )
}

export default function TheProblemSlide() {
  return (
    <div className="bg-white rounded-xl border border-rippling-line shadow-rippling-card overflow-hidden">
      {/* Header */}
      <div className="px-10 pt-10 pb-7 border-b border-rippling-line bg-rippling-surface">
        <p className="text-[10.5px] font-bold tracking-widest text-rippling-muted uppercase mb-2.5">
          Slide 1 of 4
        </p>
        <h1 className="text-[34px] font-bold text-rippling-ink tracking-tight leading-tight mb-2">
          The Problem
        </h1>
        <p className="text-[16px] text-rippling-ink-2 font-medium">
          Bulk change today fails on{' '}
          <span className="text-rippling-plum font-semibold">four fronts</span>
        </p>
      </div>

      {/* 2×2 quadrant grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-rippling-line">
        <QuadrantCard
          label="The Work"
          lines={[
            { text: "One-at-a-time editing doesn't scale." },
            { text: '200-person re-org = 200 manual edits.', highlight: true },
            { text: 'Mistakes inevitable; consistency impossible.' },
          ]}
        />

        <QuadrantCard
          label="Collaboration"
          lines={[
            { text: 'Coordination happens out-of-band.' },
            { text: 'Intent in spreadsheets. Approvals in Slack.', highlight: true },
            { text: 'Audit nowhere. Change set reconstructed later.' },
          ]}
        />

        <QuadrantCard
          label="Consequences"
          lines={[
            { text: "Blast radius is invisible until it's too late.", highlight: true },
            { text: 'Manager changes leak access.' },
            { text: 'Comp breaks payroll. Re-orgs strand integrations.' },
          ]}
        />

        <QuadrantCard
          label="Dependencies"
          lines={[
            { text: 'Downstream tasks fall through the cracks.', highlight: true },
            { text: 'Laptop shipments, visas, comp letters, training —' },
            { text: 'every change creates work no one tracks.' },
          ]}
        />
      </div>

      {/* Footer tagline */}
      <div className="px-10 py-6 bg-rippling-surface border-t border-rippling-line">
        <p className="text-[13.5px] text-rippling-ink-2 leading-relaxed italic">
          "Bulk change isn't a{' '}
          <span className="text-rippling-plum font-semibold not-italic">data problem</span>.
          {' '}It's a{' '}
          <span className="text-rippling-plum font-semibold not-italic">coordination problem</span>
          {' '}disguised as one."
        </p>
      </div>
    </div>
  )
}
