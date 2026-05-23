import { AlertTriangle, ShieldAlert, UserX, BriefcaseBusiness } from 'lucide-react'

type Violation = {
  id: string
  title: string
  detail: string
  actions: string
}

type Props = {
  open: boolean
  violations: Violation[]
  onClose: () => void
}

export default function ViolationsPanel({ open, violations, onClose }: Props) {
  return (
    <>
      {open && <button className="fixed inset-0 bg-black/25 z-30" onClick={onClose} aria-label="Close violations panel" />}
      <aside
        className={`fixed right-0 top-0 h-full w-[360px] bg-white border-l border-rippling-line z-40 transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-12 px-4 border-b border-rippling-line flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-rippling-ink">Violations & Warnings</h3>
          <button type="button" onClick={onClose} className="text-[12px] text-rippling-muted hover:text-rippling-ink">
            Close
          </button>
        </div>
        <div className="p-3 space-y-2 overflow-auto h-[calc(100%-48px)]">
          {violations.map((violation) => (
            <div key={violation.id} className="rounded-md border border-rippling-line p-2 bg-rippling-surface">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-600">
                  {violation.id === 'permission' ? (
                    <ShieldAlert size={14} />
                  ) : violation.id === 'leave' ? (
                    <BriefcaseBusiness size={14} />
                  ) : violation.id === 'overlap' ? (
                    <AlertTriangle size={14} />
                  ) : (
                    <UserX size={14} />
                  )}
                </span>
                <div>
                  <p className="text-[12.5px] font-semibold text-rippling-ink">{violation.title}</p>
                  <p className="text-[12px] text-rippling-muted">{violation.detail}</p>
                  <p className="text-[11.5px] text-rippling-plum mt-1">{violation.actions}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
