import { useMemo, useRef, useState } from 'react'
import { Command, Keyboard } from 'lucide-react'
import WorklistHeader from './worklist/WorklistHeader'
import EntryMethodTabs, { type EntryMethod, type FilterChip } from './worklist/EntryMethodTabs'
import CenterResults from './worklist/CenterResults'
import SelectionTray from './worklist/SelectionTray'
import ViolationsPanel from './worklist/ViolationsPanel'
import EmptyCanvasState from './worklist/EmptyCanvasState'
import { AI_PROMPT_PRESETS, WORKLIST_EMPLOYEES, type WorklistEmployee } from '../mock/employees'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

type Props = {
  onBack: () => void
  initialSelectedIds?: string[]
}

function createChip(attribute: string, operator = 'is', value = ''): FilterChip {
  return {
    id: `${attribute}-${Math.random().toString(36).slice(2, 8)}`,
    attribute,
    operator,
    value,
  }
}

function applyFilterChip(employee: WorklistEmployee, chip: FilterChip) {
  const value = chip.value.trim()
  const values = value.split(',').map((part) => part.trim().toLowerCase()).filter(Boolean)
  const normalize = (input: string) => input.toLowerCase()
  const containsAny = (source: string) => values.some((candidate) => normalize(source).includes(candidate))
  const equalsAny = (source: string) => values.includes(normalize(source))

  switch (chip.attribute) {
    case 'Department':
      return chip.operator === 'is not' ? !equalsAny(employee.department) : equalsAny(employee.department)
    case 'Manager':
      return chip.operator === 'contains'
        ? containsAny(employee.managerName)
        : chip.operator === 'is not'
          ? !equalsAny(employee.managerName)
          : equalsAny(employee.managerName)
    case 'Title':
      return chip.operator === 'contains' ? containsAny(employee.title) : equalsAny(employee.title)
    case 'Level':
      return chip.operator === 'is one of' ? equalsAny(employee.level) : normalize(employee.level) === normalize(value)
    case 'Location':
      return chip.operator === 'contains' ? containsAny(employee.location) : equalsAny(employee.city)
    case 'Employment type':
      return chip.operator === 'is not' ? !equalsAny(employee.employmentType) : equalsAny(employee.employmentType)
    case 'Tenure': {
      const parsed = Number(value.replace(/[^\d]/g, ''))
      if (Number.isNaN(parsed)) return true
      if (value.includes('<')) return employee.tenureMonths < parsed
      if (value.includes('>')) return employee.tenureMonths > parsed
      return employee.tenureMonths === parsed
    }
    default:
      return true
  }
}

function parseAiPrompt(prompt: string): { chips: FilterChip[]; options: FilterChip[][] } {
  const key = prompt.trim().toLowerCase()
  if (AI_PROMPT_PRESETS[key]) {
    return {
      chips: AI_PROMPT_PRESETS[key].chips.map((chip) => createChip(chip.attribute, chip.operator, chip.value)),
      options: [],
    }
  }

  if (key.includes('john lee')) {
    return {
      chips: [],
      options: [
        [createChip('Department', 'is', 'Sales'), createChip('Title', 'contains', 'Account Executive')],
        [createChip('Department', 'is', 'Engineering'), createChip('Location', 'contains', 'New York')],
      ],
    }
  }

  return {
    chips: [createChip('Department', 'is', 'Engineering'), createChip('Location', 'contains', 'San Francisco')],
    options: [],
  }
}

function csvFromSelection(selectedEmployees: WorklistEmployee[]) {
  const header = ['id', 'fullName', 'email', 'department', 'title', 'location'].join(',')
  const rows = selectedEmployees.map((employee) =>
    [employee.id, employee.fullName, employee.email, employee.department, employee.title, employee.location]
      .map((value) => `"${value.replace(/"/g, '""')}"`)
      .join(',')
  )
  return [header, ...rows].join('\n')
}

export default function WorklistCanvas({ onBack, initialSelectedIds = [] }: Props) {
  const [worklistName, setWorklistName] = useState('Untitled worklist')
  const [usedMethod, setUsedMethod] = useState(false)
  const [activeMethod, setActiveMethod] = useState<EntryMethod>('filter')
  const [filterChips, setFilterChips] = useState<FilterChip[]>([])
  const [globalQuery, setGlobalQuery] = useState('')
  const [manualQuery, setManualQuery] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiInterpretation, setAiInterpretation] = useState<FilterChip[]>([])
  const [aiOptions, setAiOptions] = useState<FilterChip[][]>([])
  const [pasteValue, setPasteValue] = useState('')
  const [pasteMatches, setPasteMatches] = useState<
    Array<{ raw: string; status: 'matched' | 'ambiguous' | 'unmatched'; employeeIds: string[]; message: string }>
  >([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds))
  const [trayExpanded, setTrayExpanded] = useState(false)
  const [view, setView] = useState<'list' | 'org'>('list')
  const [hoveredIndex, setHoveredIndex] = useState(0)
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set())
  const [showViolations, setShowViolations] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showCheatsheet, setShowCheatsheet] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filterResults = useMemo(
    () =>
      WORKLIST_EMPLOYEES.filter((employee) =>
        filterChips.every((chip) => !chip.value.trim() || applyFilterChip(employee, chip))
      ),
    [filterChips]
  )

  const aiResults = useMemo(
    () =>
      WORKLIST_EMPLOYEES.filter((employee) =>
        aiInterpretation.length === 0 ? false : aiInterpretation.every((chip) => applyFilterChip(employee, chip))
      ),
    [aiInterpretation]
  )

  const manualResults = useMemo(() => {
    const q = manualQuery.trim().toLowerCase()
    if (!q) return WORKLIST_EMPLOYEES
    return WORKLIST_EMPLOYEES.filter((employee) => {
      return `${employee.fullName} ${employee.email}`.toLowerCase().includes(q)
    })
  }, [manualQuery])

  const methodResults = useMemo(() => {
    switch (activeMethod) {
      case 'filter':
        return filterResults
      case 'ai':
        return aiInterpretation.length ? aiResults : []
      case 'paste': {
        const ids = new Set(pasteMatches.flatMap((match) => (match.status === 'matched' ? match.employeeIds : [])))
        return WORKLIST_EMPLOYEES.filter((employee) => ids.has(employee.id))
      }
      case 'manual':
        return manualResults
      default:
        return []
    }
  }, [activeMethod, aiInterpretation.length, aiResults, filterResults, manualResults, pasteMatches])

  const results = useMemo(() => {
    const q = globalQuery.trim().toLowerCase()
    if (!q) return methodResults
    return methodResults.filter((employee) => {
      return `${employee.fullName} ${employee.email} ${employee.title} ${employee.department} ${employee.managerName}`
        .toLowerCase()
        .includes(q)
    })
  }, [globalQuery, methodResults])

  const selectedEmployees = useMemo(
    () => WORKLIST_EMPLOYEES.filter((employee) => selectedIds.has(employee.id)),
    [selectedIds]
  )

  const hoveredId = results[hoveredIndex]?.id || null

  const violations = useMemo(() => {
    const restricted = selectedEmployees.filter((employee) => !employee.hasEditAccess)
    const onLeave = selectedEmployees.filter((employee) => employee.status === 'on_leave')
    const terminated = selectedEmployees.filter((employee) => employee.status === 'terminated')
    const overlap = selectedEmployees.slice(0, Math.min(3, selectedEmployees.length))
    const list: Array<{ id: string; title: string; detail: string; actions: string }> = []
    if (restricted.length > 0) {
      list.push({
        id: 'permission',
        title: `Permission scope: no access for ${restricted.length} selected employees`,
        detail: `You can edit ${selectedEmployees.length - restricted.length} of ${selectedEmployees.length}.`,
        actions: 'Show editable only / Request access to all',
      })
    }
    if (onLeave.length > 0) {
      list.push({
        id: 'leave',
        title: `${onLeave.map((employee) => employee.fullName).join(', ')} ${onLeave.length === 1 ? 'is' : 'are'} on leave`,
        detail: 'Changes are deferred until leave ends.',
        actions: 'Keep selected / Defer changes',
      })
    }
    if (overlap.length >= 3) {
      list.push({
        id: 'overlap',
        title: '3 employees are in "Q4 Comp Cycle" draft',
        detail: 'Owned by Riya Patel. You can continue or view overlap.',
        actions: 'Continue anyway / View overlap',
      })
    }
    if (terminated.length > 0) {
      list.push({
        id: 'terminated',
        title: `${terminated.map((employee) => employee.fullName).join(', ')} was recently terminated`,
        detail: 'Offboarded records may not accept changes.',
        actions: 'Remove from selection / Keep for audit',
      })
    }
    return list
  }, [selectedEmployees])

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 1600)
  }

  function toggleSelection(employeeId: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (next.has(employeeId)) next.delete(employeeId)
      else next.add(employeeId)
      return next
    })
    setFlashIds((previous) => new Set(previous).add(employeeId))
    window.setTimeout(() => {
      setFlashIds((previous) => {
        const next = new Set(previous)
        next.delete(employeeId)
        return next
      })
    }, 200)
  }

  function addMany(employeeIds: string[]) {
    setSelectedIds((previous) => new Set([...previous, ...employeeIds]))
  }

  function parsePasteEntries() {
    const lines = pasteValue
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const nextMatches = lines.map((line) => {
      const byEmail = WORKLIST_EMPLOYEES.filter((employee) => employee.email.toLowerCase() === line.toLowerCase())
      if (byEmail.length === 1) {
        return {
          raw: line,
          status: 'matched' as const,
          employeeIds: [byEmail[0].id],
          message: `Matched ${byEmail[0].fullName} <${byEmail[0].email}>`,
        }
      }

      const byName = WORKLIST_EMPLOYEES.filter((employee) => employee.fullName.toLowerCase() === line.toLowerCase())
      if (byName.length === 1) {
        return {
          raw: line,
          status: 'matched' as const,
          employeeIds: [byName[0].id],
          message: `Matched ${byName[0].fullName} <${byName[0].email}>`,
        }
      }

      if (byName.length > 1) {
        return {
          raw: line,
          status: 'ambiguous' as const,
          employeeIds: byName.map((employee) => employee.id),
          message: `Did you mean ${byName.map((employee) => `${employee.fullName} (${employee.department})`).join(' or ')}?`,
        }
      }

      return {
        raw: line,
        status: 'unmatched' as const,
        employeeIds: [],
        message: 'No match found',
      }
    })

    setPasteMatches(nextMatches)
  }

  useKeyboardShortcuts({
    onOpenCommandPalette: () => setShowCommandPalette((previous) => !previous),
    onFocusSearch: () => searchRef.current?.focus(),
    onOpenFilters: () => {
      setUsedMethod(true)
      setActiveMethod('filter')
    },
    onSelectAllVisible: () => addMany(results.map((employee) => employee.id)),
    onToggleHovered: () => {
      if (!hoveredId) return
      toggleSelection(hoveredId)
    },
    onHoverNext: () => setHoveredIndex((previous) => (results.length === 0 ? 0 : Math.min(results.length - 1, previous + 1))),
    onHoverPrevious: () => setHoveredIndex((previous) => Math.max(0, previous - 1)),
    onClearSelection: () => {
      setShowCommandPalette(false)
      setShowCheatsheet(false)
      setSelectedIds(new Set())
    },
    onToggleCheatsheet: () => setShowCheatsheet((previous) => !previous),
  })

  const summaryManagers = new Set(selectedEmployees.map((employee) => employee.managerName)).size
  const summaryDepartments = new Set(selectedEmployees.map((employee) => employee.department)).size
  const summaryCountries = new Set(selectedEmployees.map((employee) => employee.country)).size

  return (
    <div className="h-full flex flex-col bg-rippling-surface relative">
      <WorklistHeader
        name={worklistName}
        selectedCount={selectedEmployees.length}
        onNameChange={setWorklistName}
        onBack={onBack}
        onSaveDraft={() => showToast('Draft saved (mock).')}
      />

      {!usedMethod ? (
        <EmptyCanvasState
          onPickMethod={(method) => {
            setActiveMethod(method)
            setUsedMethod(true)
          }}
        />
      ) : (
        <div className="flex-1 min-h-0 flex">
          <EntryMethodTabs
            activeMethod={activeMethod}
            onMethodChange={(method) => {
              setActiveMethod(method)
              setUsedMethod(true)
            }}
            filterChips={filterChips}
            onAddFilter={() => setFilterChips((previous) => [...previous, createChip('Department', 'is', '')])}
            onUpdateFilter={(id, patch) =>
              setFilterChips((previous) => previous.map((chip) => (chip.id === id ? { ...chip, ...patch } : chip)))
            }
            onRemoveFilter={(id) => setFilterChips((previous) => previous.filter((chip) => chip.id !== id))}
            filterPreviewCount={filterResults.length}
            onAddAllFiltered={() => addMany(filterResults.map((employee) => employee.id))}
            aiPrompt={aiPrompt}
            onAiPromptChange={setAiPrompt}
            onRunAi={() => {
              const parsed = parseAiPrompt(aiPrompt)
              setAiInterpretation(parsed.chips)
              setAiOptions(parsed.options)
            }}
            aiInterpretation={aiInterpretation}
            aiOptions={aiOptions}
            onUseAiOption={(chips) => {
              setAiInterpretation(chips)
              setAiOptions([])
            }}
            onAddAllAi={() => addMany(aiResults.map((employee) => employee.id))}
            pasteValue={pasteValue}
            onPasteValueChange={setPasteValue}
            onResolvePaste={parsePasteEntries}
            pasteMatches={pasteMatches}
            onAddMatched={() => addMany(pasteMatches.flatMap((match) => (match.status === 'matched' ? match.employeeIds : [])))}
            manualQuery={manualQuery}
            onManualQueryChange={setManualQuery}
          />
          <CenterResults
            query={globalQuery}
            onQueryChange={setGlobalQuery}
            searchRef={searchRef}
            view={view}
            onViewChange={setView}
            results={results}
            selectedIds={selectedIds}
            hoveredId={hoveredId}
            onHover={(id) => setHoveredIndex(Math.max(0, results.findIndex((employee) => employee.id === id)))}
            onToggleSelection={toggleSelection}
            violationsCount={violations.length}
            onOpenViolations={() => setShowViolations(true)}
            flashIds={flashIds}
          />
        </div>
      )}

      <SelectionTray
        selectedEmployees={selectedEmployees}
        expanded={trayExpanded}
        onToggleExpanded={() => setTrayExpanded((previous) => !previous)}
        onRemove={(id) => toggleSelection(id)}
        onRemoveAll={() => setSelectedIds(new Set())}
        onExportCsv={() => {
          navigator.clipboard.writeText(csvFromSelection(selectedEmployees))
          showToast('Selection CSV copied to clipboard.')
        }}
        onSaveSupergroup={() => showToast('Saved as Supergroup (mock).')}
      />

      <ViolationsPanel open={showViolations} violations={violations} onClose={() => setShowViolations(false)} />

      {showCommandPalette && (
        <div className="fixed inset-0 z-40 bg-black/25 flex items-start justify-center pt-24">
          <div className="w-[560px] rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown">
            <div className="h-10 border-b border-rippling-line px-3 flex items-center gap-2 text-[13px] text-rippling-muted">
              <Command size={14} />
              Command palette
            </div>
            <div className="p-2 grid grid-cols-2 gap-2 text-[12.5px]">
              <button type="button" onClick={() => setActiveMethod('filter')} className="rounded-md border border-rippling-line p-2 text-left">
                Open Filter tab
              </button>
              <button type="button" onClick={() => setActiveMethod('ai')} className="rounded-md border border-rippling-line p-2 text-left">
                Open Ask AI tab
              </button>
              <button type="button" onClick={() => setActiveMethod('paste')} className="rounded-md border border-rippling-line p-2 text-left">
                Open Paste/Upload tab
              </button>
              <button type="button" onClick={() => setActiveMethod('manual')} className="rounded-md border border-rippling-line p-2 text-left">
                Open Manual search tab
              </button>
              <button type="button" onClick={() => setFilterChips([createChip('Department', 'is', 'Engineering')])} className="rounded-md border border-rippling-line p-2 text-left">
                Recent: Dept = Engineering
              </button>
              <button type="button" onClick={() => showToast('Loaded saved supergroup (mock).')} className="rounded-md border border-rippling-line p-2 text-left">
                Saved supergroup: IC Engineers
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheatsheet && (
        <div className="fixed bottom-4 right-4 z-40 w-[320px] rounded-lg border border-rippling-line bg-white p-3 shadow-rippling-dropdown text-[12px]">
          <p className="font-semibold text-rippling-ink mb-2 flex items-center gap-1.5">
            <Keyboard size={12} /> Keyboard shortcuts
          </p>
          <ul className="space-y-1 text-rippling-ink-2">
            <li><kbd className="px-1 border border-rippling-line rounded">Cmd/Ctrl + K</kbd> Open command palette</li>
            <li><kbd className="px-1 border border-rippling-line rounded">/</kbd> Focus search</li>
            <li><kbd className="px-1 border border-rippling-line rounded">f</kbd> Open filters</li>
            <li><kbd className="px-1 border border-rippling-line rounded">Cmd/Ctrl + A</kbd> Select all visible</li>
            <li><kbd className="px-1 border border-rippling-line rounded">x</kbd> Toggle hovered row</li>
            <li><kbd className="px-1 border border-rippling-line rounded">↑ / ↓</kbd> Navigate rows</li>
            <li><kbd className="px-1 border border-rippling-line rounded">Esc</kbd> Clear selection</li>
          </ul>
        </div>
      )}

      {toast && <div className="fixed right-4 top-16 z-50 rounded-md bg-rippling-plum text-white text-[12.5px] px-3 py-2">{toast}</div>}

      {selectedEmployees.length > 0 && !usedMethod && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-4 rounded-full bg-white border border-rippling-line px-3 py-1 text-[12px] text-rippling-muted">
          {selectedEmployees.length} employees · {summaryManagers} managers · {summaryDepartments} departments · {summaryCountries} countries
        </div>
      )}
    </div>
  )
}
