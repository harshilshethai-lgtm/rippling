function AssumptionItem({ number, headline, body }) {
  return (
    <div className="flex gap-8">
      <div className="w-16 flex-shrink-0 text-right">
        <span className="text-[56px] font-light leading-none text-rippling-primary/40 tabular-nums">
          {number}
        </span>
      </div>
      <div className="flex-1 pt-2 space-y-1.5">
        <p className="text-[15px] font-semibold text-rippling-ink leading-snug">{headline}</p>
        <p className="text-[13.5px] text-rippling-ink-2 leading-relaxed">{body}</p>
      </div>
    </div>
  )
}

export default function AssumptionsSlide() {
  return (
    <div className="bg-white rounded-xl border border-rippling-line shadow-rippling-card overflow-hidden">
      <div className="px-10 pt-10 pb-7 border-b border-rippling-line bg-rippling-surface">
        <p className="text-[10.5px] font-bold tracking-widest text-rippling-muted uppercase mb-2.5">
          Slide 2 of 4
        </p>
        <h1 className="text-[34px] font-bold text-rippling-ink tracking-tight leading-tight">
          Assumptions
        </h1>
      </div>

      <div className="px-10 py-10 space-y-10">
        <AssumptionItem
          number="01"
          headline="The user is CSV-native, not AI-native."
          body="HR generalists, HRBPs, founders. Live in spreadsheets. Early in their AI trust curve. AI is a narrative layer over a structured workflow — not the primary surface."
        />
        <AssumptionItem
          number="02"
          headline="The platform does the heavy lifting."
          body="Events, rules, Supergroups, propagation — all exist already. I'm designing the workflow surface, not re-architecting the platform. Next slide explains the model."
        />
        <AssumptionItem
          number="03"
          headline="Partial failure is the norm."
          body="Successes commit. Failures surface as recoverable items the user resolves or discards. The change goes through for the rest. Never false green."
        />
      </div>


    </div>
  )
}
