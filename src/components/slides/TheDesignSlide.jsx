export default function TheDesignSlide() {
  return (
    <div className="bg-white rounded-xl border border-rippling-line shadow-rippling-card overflow-hidden flex flex-col min-h-[480px]">
      {/* Header */}
      <div className="px-10 pt-10 pb-7 border-b border-rippling-line bg-rippling-surface">
        <p className="text-[10.5px] font-bold tracking-widest text-rippling-muted uppercase mb-2.5">
          Slide 4 of 4
        </p>
        <h1 className="text-[34px] font-bold text-rippling-ink tracking-tight leading-tight">
          The Design
        </h1>
      </div>

      {/* Centered thesis box */}
      <div className="flex-1 flex items-center justify-center px-12 py-14">
        <div className="border border-rippling-plum/20 rounded-xl bg-rippling-chip px-10 py-9 max-w-xl w-full">
          <p className="text-[20px] font-semibold text-rippling-ink leading-snug mb-4">
            A single change set carries a bulk change{' '}
            <span className="text-rippling-plum">from staging to landing.</span>
          </p>
          <p className="text-[14px] text-rippling-ink-2 leading-relaxed">
            It holds{' '}
            <span className="text-rippling-ink font-medium">intent, risk, approvals, and follow-through</span>
            {' '}— across one workflow that scales from a dozen employees to a thousand.
          </p>
        </div>
      </div>
    </div>
  )
}
