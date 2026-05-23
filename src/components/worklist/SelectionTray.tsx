import { ChevronUp, Download, Save, Trash2, X } from 'lucide-react'
import type { WorklistEmployee } from '../../mock/employees'

type Props = {
  selectedEmployees: WorklistEmployee[]
  expanded: boolean
  onToggleExpanded: () => void
  onRemove: (id: string) => void
  onRemoveAll: () => void
  onExportCsv: () => void
  onSaveSupergroup: () => void
}

function uniqueCount(values: string[]) {
  return new Set(values).size
}

export default function SelectionTray({
  selectedEmployees,
  expanded,
  onToggleExpanded,
  onRemove,
  onRemoveAll,
  onExportCsv,
  onSaveSupergroup,
}: Props) {
  if (selectedEmployees.length === 0) return null

  const managerCount = uniqueCount(selectedEmployees.map((employee) => employee.managerName))
  const departmentCount = uniqueCount(selectedEmployees.map((employee) => employee.department))
  const countryCount = uniqueCount(selectedEmployees.map((employee) => employee.country))
  const downstreamResources = selectedEmployees.length * 4 - Math.floor(selectedEmployees.length / 3)

  return (
    <footer className="border-t border-rippling-line bg-white sticky bottom-0 anim-slide-in-bottom">
      <button
        type="button"
        onClick={onToggleExpanded}
        className="w-full h-11 px-4 flex items-center justify-between hover:bg-rippling-surface transition-colors"
      >
        <span className="text-[13px] text-rippling-ink">
          {selectedEmployees.length} selected · {managerCount} managers · {departmentCount} depts · {countryCount} countries · Effective scope:{' '}
          {selectedEmployees.length} nodes + {downstreamResources} downstream resources
        </span>
        <div className="flex items-center gap-2 text-[12.5px] text-rippling-muted">
          <span>View all</span>
          <ChevronUp size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-rippling-line px-4 py-3 bg-rippling-surface">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={onRemoveAll}
              className="h-7 px-2 rounded-md border border-rippling-line bg-white text-[12px] flex items-center gap-1"
            >
              <Trash2 size={12} />
              Remove all
            </button>
            <button
              type="button"
              onClick={onExportCsv}
              className="h-7 px-2 rounded-md border border-rippling-line bg-white text-[12px] flex items-center gap-1"
            >
              <Download size={12} />
              Export selection as CSV
            </button>
            <button
              type="button"
              onClick={onSaveSupergroup}
              className="h-7 px-2 rounded-md border border-rippling-line bg-white text-[12px] flex items-center gap-1"
            >
              <Save size={12} />
              Save as Supergroup
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {selectedEmployees.map((employee) => (
              <span
                key={employee.id}
                className="inline-flex items-center gap-1 rounded-full bg-white border border-rippling-line px-2 py-1 text-[11.5px] text-rippling-ink"
              >
                <span>{employee.fullName}</span>
                <button
                  type="button"
                  onClick={() => onRemove(employee.id)}
                  className="h-4 w-4 rounded-full text-rippling-muted hover:text-rippling-ink"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </footer>
  )
}
