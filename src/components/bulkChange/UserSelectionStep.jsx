import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, FileUp, X } from 'lucide-react'
import { EMPLOYEES } from '../../data/employees'
import LinearFilterBar from './LinearFilterBar'
import ResultsTable from './ResultsTable'
import EmptyState from './EmptyState'
import {
  FILTER_ATTRIBUTES,
  FILTER_SCHEMA,
  applyFilters,
  buildWorklist,
  dedupeValues,
  dynamicColumnsFromChips,
  makeChipId,
  scopeOptionsForAttribute,
} from './bulkChangeUtils'

const BANNER_DISMISS_MS = 5000

const LEGACY_TO_ATTRIBUTE = {
  department: 'Department',
  location: 'Work location',
  manager: 'Manager',
  employmentType: 'Employment type',
  status: 'Status',
}

function chipsFromInitialFilters(initialFilters) {
  if (!initialFilters) return []
  const chips = []
  for (const [legacyKey, values] of Object.entries(initialFilters)) {
    const attribute = LEGACY_TO_ATTRIBUTE[legacyKey]
    if (!attribute || !Array.isArray(values) || values.length === 0) continue
    chips.push({ id: makeChipId(), attribute, kind: 'categorical', values: dedupeValues(values) })
  }
  return chips
}

export default function UserSelectionStep({
  initialFilters,
  initialEmployeeIds = [],
  onSelectionChange,
  registerCsvImport,
}) {
  const [chips, setChips] = useState(() => chipsFromInitialFilters(initialFilters))
  const [mentionedIds, setMentionedIds] = useState(() => {
    const validIds = new Set(EMPLOYEES.map((employee) => employee.id))
    return new Set(initialEmployeeIds.filter((id) => validIds.has(id)))
  })
  const [csvImportIds, setCsvImportIds] = useState(() => new Set())
  const [excludedIds, setExcludedIds] = useState(() => new Set())
  const [search, setSearch] = useState('')
  const [csvBanner, setCsvBanner] = useState(null) // { added, missed, missedRows }
  const bannerTimerRef = useRef(null)

  const worklist = useMemo(
    () => buildWorklist(EMPLOYEES, chips, mentionedIds, csvImportIds),
    [chips, mentionedIds, csvImportIds],
  )

  const filteredWorklist = useMemo(() => {
    const trimmed = search.trim().toLowerCase()
    if (!trimmed) return worklist
    return worklist.filter(({ employee }) => {
      const haystack = `${employee.fullName} ${employee.email} ${employee.title} ${employee.department} ${employee.manager || ''}`
      return haystack.toLowerCase().includes(trimmed)
    })
  }, [worklist, search])

  const dynamicColumns = useMemo(() => dynamicColumnsFromChips(chips), [chips])

  const mentionedEmployees = useMemo(
    () =>
      [...mentionedIds]
        .map((id) => EMPLOYEES.find((employee) => employee.id === id))
        .filter(Boolean),
    [mentionedIds],
  )

  const filterMatchCount = useMemo(() => applyFilters(EMPLOYEES, chips).length, [chips])

  // Drop stale exclusions whenever the candidate pool shrinks so a removed +
  // re-added filter doesn't leak old opt-outs back in.
  useEffect(() => {
    setExcludedIds((prev) => {
      if (prev.size === 0) return prev
      const poolIds = new Set(worklist.map(({ employee }) => employee.id))
      let changed = false
      const next = new Set()
      for (const id of prev) {
        if (poolIds.has(id)) next.add(id)
        else changed = true
      }
      return changed ? next : prev
    })
  }, [worklist])

  const selectedIds = useMemo(() => {
    const set = new Set()
    for (const { employee } of worklist) {
      if (!excludedIds.has(employee.id)) set.add(employee.id)
    }
    return set
  }, [worklist, excludedIds])

  // Bubble selection summary up to the shell so the Continue CTA can react.
  useEffect(() => {
    onSelectionChange?.({
      candidates: worklist.length,
      selected: selectedIds.size,
      filteredCount: filterMatchCount,
      mentionedCount: mentionedIds.size,
    })
  }, [worklist.length, selectedIds.size, filterMatchCount, mentionedIds.size, onSelectionChange])

  const attributeCounts = useMemo(() => {
    const counts = {}
    for (const attribute of FILTER_ATTRIBUTES) {
      const field = FILTER_SCHEMA[attribute].field
      const others = chips.filter((chip) => chip.attribute !== attribute)
      const scoped = applyFilters(EMPLOYEES, others)
      counts[attribute] = new Set(scoped.map((employee) => employee[field]).filter(Boolean)).size
    }
    return counts
  }, [chips])

  const scopeForAttribute = useCallback(
    (attribute, editingChipId) =>
      scopeOptionsForAttribute(EMPLOYEES, attribute, chips, editingChipId),
    [chips],
  )

  // Built once: the parser is deterministic and doesn't need to recompute
  // these every render. EMPLOYEES is module-static.
  const aiContext = useMemo(() => {
    const departments = new Set()
    const locations = new Set()
    const managers = new Set()
    const titles = new Set()
    for (const employee of EMPLOYEES) {
      if (employee.department) departments.add(employee.department)
      if (employee.location) locations.add(employee.location)
      if (employee.manager) managers.add(employee.manager)
      if (employee.title) titles.add(employee.title)
    }
    return {
      employees: EMPLOYEES,
      departments: [...departments].sort(),
      locations: [...locations].sort(),
      managers: [...managers].sort(),
      titles: [...titles].sort(),
    }
  }, [])

  function addChip({ attribute, values }) {
    setChips((prev) => {
      const existing = prev.find((chip) => chip.attribute === attribute)
      if (existing) {
        return prev.map((chip) =>
          chip.id === existing.id
            ? { ...chip, kind: 'categorical', values: dedupeValues([...chip.values, ...values]) }
            : chip,
        )
      }
      return [...prev, { id: makeChipId(), attribute, kind: 'categorical', values: dedupeValues(values) }]
    })
  }

  /**
   * Apply a batch of provisional chips from the AI parser. Categorical chips
   * merge with the existing chip for that attribute (additive); date_range
   * chips replace the existing range chip for that attribute (latest wins).
   */
  function addChips(provisionalChips) {
    if (!Array.isArray(provisionalChips) || provisionalChips.length === 0) return
    setChips((prev) => {
      let next = [...prev]
      for (const provisional of provisionalChips) {
        const kind = provisional.kind || 'categorical'
        if (kind === 'date_range') {
          const idx = next.findIndex((chip) => chip.attribute === provisional.attribute)
          const newChip = {
            id: idx >= 0 ? next[idx].id : makeChipId(),
            attribute: provisional.attribute,
            kind: 'date_range',
            range: provisional.range,
          }
          if (idx >= 0) {
            next = next.map((chip, i) => (i === idx ? newChip : chip))
          } else {
            next = [...next, newChip]
          }
          continue
        }

        const values = dedupeValues(provisional.values || [])
        if (values.length === 0) continue
        const idx = next.findIndex((chip) => chip.attribute === provisional.attribute)
        if (idx >= 0) {
          next = next.map((chip, i) =>
            i === idx
              ? {
                  ...chip,
                  kind: 'categorical',
                  values: dedupeValues([...(chip.values || []), ...values]),
                }
              : chip,
          )
        } else {
          next = [
            ...next,
            { id: makeChipId(), attribute: provisional.attribute, kind: 'categorical', values },
          ]
        }
      }
      return next
    })
  }

  function updateChip(chipId, patch) {
    setChips((prev) =>
      prev.map((chip) =>
        chip.id === chipId
          ? {
              ...chip,
              attribute: patch.attribute ?? chip.attribute,
              values: patch.values ? dedupeValues(patch.values) : chip.values,
            }
          : chip,
      ),
    )
  }

  function removeChip(chipId) {
    setChips((prev) => prev.filter((chip) => chip.id !== chipId))
  }

  function addMention(employee) {
    setMentionedIds((prev) => {
      if (prev.has(employee.id)) return prev
      const next = new Set(prev)
      next.add(employee.id)
      return next
    })
    // Always re-include a freshly mentioned person, even if they were excluded
    // earlier (e.g. user filtered a department, unticked them, then @-mentioned
    // them anyway).
    setExcludedIds((prev) => {
      if (!prev.has(employee.id)) return prev
      const next = new Set(prev)
      next.delete(employee.id)
      return next
    })
  }

  const handleCsvImport = useCallback(({ resolvedIds = [], missedRows = [] } = {}) => {
    if (resolvedIds.length > 0) {
      setCsvImportIds((prev) => {
        const next = new Set(prev)
        for (const id of resolvedIds) next.add(id)
        return next
      })
      // Re-include any imported employees that had been excluded earlier so
      // CSV imports always land in the worklist, mirroring @-mention behavior.
      setExcludedIds((prev) => {
        if (prev.size === 0) return prev
        let changed = false
        const next = new Set(prev)
        for (const id of resolvedIds) {
          if (next.delete(id)) changed = true
        }
        return changed ? next : prev
      })
    }
    setCsvBanner({
      added: resolvedIds.length,
      missed: missedRows.length,
      missedRows,
    })
  }, [])

  function dismissBanner() {
    setCsvBanner(null)
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current)
      bannerTimerRef.current = null
    }
  }

  // Auto-dismiss the post-import banner after a few seconds.
  useEffect(() => {
    if (!csvBanner) return undefined
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
    bannerTimerRef.current = setTimeout(() => {
      setCsvBanner(null)
      bannerTimerRef.current = null
    }, BANNER_DISMISS_MS)
    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current)
        bannerTimerRef.current = null
      }
    }
  }, [csvBanner])

  // Register the import handler with the parent so the page-header CSV button
  // can dispatch through here without lifting the worklist state up.
  useEffect(() => {
    registerCsvImport?.(handleCsvImport)
    return () => registerCsvImport?.(null)
  }, [registerCsvImport, handleCsvImport])

  function removeMention(employeeId) {
    setMentionedIds((prev) => {
      if (!prev.has(employeeId)) return prev
      const next = new Set(prev)
      next.delete(employeeId)
      return next
    })
  }

  function removeCsvImport(employeeId) {
    setCsvImportIds((prev) => {
      if (!prev.has(employeeId)) return prev
      const next = new Set(prev)
      next.delete(employeeId)
      return next
    })
  }

  // Single "remove from worklist" action used by the X button on a row. We
  // strip every manual signal (mention + csv); if the row is also in the
  // filter scope it'll stay visible, but as filter-only.
  function removeManualSignals(employeeId) {
    removeMention(employeeId)
    removeCsvImport(employeeId)
  }

  function toggleRow(employeeId) {
    setExcludedIds((prev) => {
      const next = new Set(prev)
      if (next.has(employeeId)) next.delete(employeeId)
      else next.add(employeeId)
      return next
    })
  }

  function selectAll() {
    setExcludedIds(new Set())
  }

  function unselectAll() {
    setExcludedIds(new Set(worklist.map(({ employee }) => employee.id)))
  }

  function clearFilters() {
    setChips([])
    setMentionedIds(new Set())
    setCsvImportIds(new Set())
    setExcludedIds(new Set())
    setSearch('')
  }

  const hasAnything = chips.length > 0 || mentionedIds.size > 0 || csvImportIds.size > 0

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-6 pt-4 pb-3 border-b border-rippling-line bg-white">
        <LinearFilterBar
          search={search}
          onSearchChange={setSearch}
          employees={EMPLOYEES}
          chips={chips}
          onAddChip={addChip}
          onAddChips={addChips}
          onUpdateChip={updateChip}
          onRemoveChip={removeChip}
          mentionedEmployees={mentionedEmployees}
          onMention={addMention}
          onRemoveMention={removeMention}
          onClearFilters={clearFilters}
          attributeCounts={attributeCounts}
          scopeForAttribute={scopeForAttribute}
          aiContext={aiContext}
        />
      </div>

      <div className="flex-1 overflow-auto p-6 bg-rippling-surface">
        {csvBanner && (
          <CsvImportBanner banner={csvBanner} onDismiss={dismissBanner} />
        )}
        {!hasAnything ? (
          <EmptyState onCsvImport={handleCsvImport} />
        ) : (
          <ResultsTable
            entries={filteredWorklist}
            dynamicColumns={dynamicColumns}
            selectedIds={selectedIds}
            poolSize={worklist.length}
            filterMatchCount={filterMatchCount}
            mentionedCount={mentionedIds.size}
            csvImportCount={csvImportIds.size}
            hiddenBySearchCount={worklist.length - filteredWorklist.length}
            onToggleRow={toggleRow}
            onSelectAll={selectAll}
            onUnselectAll={unselectAll}
            onRemoveMention={removeMention}
            onRemoveManualSignals={removeManualSignals}
          />
        )}
      </div>
    </div>
  )
}

function CsvImportBanner({ banner, onDismiss }) {
  const { added, missed, missedRows } = banner
  const tone =
    added > 0 && missed === 0
      ? 'success'
      : added > 0
        ? 'mixed'
        : 'warn'
  const ring =
    tone === 'success'
      ? 'border-green-200 bg-green-50 text-green-800'
      : tone === 'mixed'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-red-200 bg-red-50 text-red-700'
  const Icon = tone === 'success' ? CheckCircle2 : FileUp

  const missedPreview = missedRows.slice(0, 3).join(', ')
  const missedExtra = missedRows.length > 3 ? ` +${missedRows.length - 3} more` : ''

  return (
    <div
      role="status"
      className={`mb-4 flex items-start gap-3 rounded-lg border px-4 py-3 ${ring}`}
    >
      <Icon size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 text-[12.5px] leading-relaxed">
        <p className="font-semibold tabular-nums">
          {added > 0 ? `Added ${added} ${added === 1 ? 'employee' : 'employees'} from CSV` : 'No employees imported'}
          {missed > 0 && (
            <span className="font-normal opacity-80">
              {' '}· Missed {missed} {missed === 1 ? 'row' : 'rows'}
            </span>
          )}
        </p>
        {missed > 0 && (
          <p className="opacity-80 mt-0.5 truncate">
            Couldn’t match: {missedPreview}{missedExtra}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 h-6 w-6 rounded hover:bg-black/5 flex items-center justify-center opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  )
}
