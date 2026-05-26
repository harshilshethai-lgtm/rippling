function DiagramLine({ children, className = '' }) {
  return (
    <div className={`whitespace-pre font-mono text-[11.5px] leading-[1.6] ${className}`}>
      {children}
    </div>
  )
}

const T = ({ children }) => <span className="text-rippling-muted">{children}</span>
const Bold = ({ children }) => <span className="text-rippling-ink font-semibold">{children}</span>
const Plum = ({ children }) => <span className="text-rippling-plum font-semibold">{children}</span>
const Dim = ({ children }) => <span className="text-rippling-muted">{children}</span>

export default function ThePlatformSlide() {
  return (
    <div className="bg-white rounded-xl border border-rippling-line shadow-rippling-card overflow-hidden">
      {/* Header */}
      <div className="px-10 pt-7 pb-5 border-b border-rippling-line bg-rippling-surface">
        <p className="text-[10.5px] font-bold tracking-widest text-rippling-muted uppercase mb-2">
          Slide 3 of 4
        </p>
        <h1 className="text-[28px] font-bold text-rippling-ink tracking-tight leading-tight">
          The Event System Assumption
        </h1>
      </div>

      {/* Flow diagram */}
      <div className="px-10 py-6">
        <DiagramLine>
          <Bold>EmployeeAttributeChanged</Bold><Dim> (location)</Dim>
        </DiagramLine>
        <DiagramLine><T>        │</T></DiagramLine>
        <DiagramLine><T>        ▼</T></DiagramLine>
        <DiagramLine>
          <Plum>  Rippling's Rule Engine</Plum>
          <Dim> ── emits ──► </Dim>
          <Bold>LocationChanged</Bold>
          <Dim>(SF → Mumbai)</Dim>
        </DiagramLine>
        <DiagramLine><T>        │</T></DiagramLine>
        <DiagramLine><T>        │</T></DiagramLine>
        <DiagramLine>
          <T>        ├──► </T>
          <Bold>RISK CLASSIFIER</Bold>
        </DiagramLine>
        <DiagramLine>
          <T>        │       </T>
          <Dim>evaluates modifiers against event context</Dim>
        </DiagramLine>
        <DiagramLine>
          <T>        │       </T>
          <T>→ </T>
          <Plum>CRITICAL</Plum>
          <Dim>  (country-crossing modifier fired)</Dim>
        </DiagramLine>
        <DiagramLine><T>        │</T></DiagramLine>
        <DiagramLine>
          <T>        └──► </T>
          <Bold>TASK RESOLVER</Bold>
        </DiagramLine>
        <DiagramLine>
          <T>                </T>
          <Dim>looks up task template for event type</Dim>
        </DiagramLine>
        <DiagramLine>
          <T>                </T>
          <Dim>evaluates modifier conditions</Dim>
        </DiagramLine>
        <DiagramLine>
          <T>                → </T>
          <Dim>instantiates the immigration task subtree</Dim>
        </DiagramLine>
        <DiagramLine><T>        │</T></DiagramLine>
        <DiagramLine><T>        ▼</T></DiagramLine>
        <DiagramLine className="text-rippling-muted mt-1">
          <Dim>{'  '}(cascade continues: also triggers </Dim>
          <Bold>SupergroupLeft</Bold>
          <Dim>(US), </Dim>
          <Bold>SupergroupJoined</Bold>
          <Dim>(India)</Dim>
        </DiagramLine>
        <DiagramLine>
          <Dim>{'   '}— and THOSE events get their own risk score and their own tasks)</Dim>
        </DiagramLine>
      </div>

      {/* Footer */}
      <div className="px-10 pb-6">
        <div className="border-t border-rippling-line mb-4" />
        <p className="text-[13.5px] text-rippling-ink-2 leading-relaxed max-w-xl">
          Sarah moves from SF to Mumbai. One write produces four events. Every surface I'll show
          you reads from this stream —{' '}
          <span className="text-rippling-ink font-medium">
            I'm designing the interpretation, not the production.
          </span>
        </p>
      </div>
    </div>
  )
}
