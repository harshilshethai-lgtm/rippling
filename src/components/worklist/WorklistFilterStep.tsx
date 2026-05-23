import { useEffect, useMemo, useRef, useState } from 'react'
import { employees } from '../../mock/employees'
import type { DraftState, WorklistFilter, WorklistStepProps } from './filterStepTypes'
import {
  CHIP_COLUMN_ATTRIBUTES,
  FILTER_SCHEMA_BY_ATTRIBUTE,
  categoricalValue,
  createEmptyDraft,
  employeeValue,
  filterMatches,
  getDefaultValue,
} from './filterStepUtils'
import WorklistStepTopBar from './WorklistStepTopBar'
import WorklistStepFilterBar from './WorklistStepFilterBar'
import WorklistStepResultsTable from './WorklistStepResultsTable'
import WorklistStepSelectionTray from './WorklistStepSelectionTray'

export default function WorklistFilterStep({ onBack, initialSelectedIds = [] }: WorklistStepProps) {
  const [worklistName, setWorklistName] = useState('Untitled worklist')
  const [nameEditing, setNameEditing] = useState(false)
  const [toast, setToast] = useState<{
    id: number
    message: string
    actionLabel?: string
    onAction?: () => void
  } | null>(null)

  const [filters, setFilters] = useState<WorklistFilter[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerStep, setPickerStep] = useState<'attribute' | 'value'>('attribute')
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftState>(createEmptyDraft())

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds.filter((id) => employees.some((employee) => employee.id === id))),
  )
  const [tableFocusIndex, setTableFocusIndex] = useState(0)
  const [expandedTray, setExpandedTray] = useState(false)
  const [visibleRows, setVisibleRows] = useState(50)
  const [sortKey, setSortKey] = useState<'name' | 'title' | (typeof CHIP_COLUMN_ATTRIBUTES)[number]>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const pickerRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const addFilterButtonRef = useRef<HTMLButtonElement>(null)
  const toastTimerRef = useRef<number | null>(null)

  const selectedEmployeeMap = useMemo(() => {
    const map = new Map<string, (typeof employees)[number]>()
    employees.forEach((employee) => map.set(employee.id, employee))
    return map
  }, [])

  const filteredEmployees = useMemo(
    () => employees.filter((employee) => filters.every((filter) => filterMatches(employee, filter))),
    [filters],
  )

  const scopedEmployeesForPicker = useMemo(() => {
    if (!draft.attribute) return employees
    const baseFilters = editingFilterId
      ? filters.filter((filter) => filter.id !== editingFilterId)
      : filters
    return employees.filter((employee) => baseFilters.every((filter) => filterMatches(employee, filter)))
  }, [draft.attribute, editingFilterId, filters])

  const scopedCategoricalOptions = useMemo(() => {
    if (!draft.attribute) return []
    const schema = FILTER_SCHEMA_BY_ATTRIBUTE.get(draft.attribute)
    if (!schema || schema.kind !== 'categorical') return []
    const uniqueValues = new Set(
      scopedEmployeesForPicker.map((employee) => categoricalValue(employee, draft.attribute)),
    )
    return [...uniqueValues].sort((a, b) => a.localeCompare(b))
  }, [draft.attribute, scopedEmployeesForPicker])

  const sortedEmployees = useMemo(() => {
    return [...filteredEmployees].sort((a, b) => {
      let av: string | number
      let bv: string | number
      if (sortKey === 'name') {
        av = a.name
        bv = b.name
      } else if (sortKey === 'title') {
        av = a.title
        bv = b.title
      } else {
        av = employeeValue(a, sortKey)
        bv = employeeValue(b, sortKey)
      }

      let cmp = 0
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv
      } else {
        const as = String(av).toLowerCase()
        const bs = String(bv).toLowerCase()
        cmp = as.localeCompare(bs)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filteredEmployees, sortDir, sortKey])

  const visibleEmployees = useMemo(() => sortedEmployees.slice(0, visibleRows), [sortedEmployees, visibleRows])

  const selectedEmployees = useMemo(
    () => [...selectedIds].map((id) => selectedEmployeeMap.get(id)).filter(Boolean) as (typeof employees)[number][],
    [selectedEmployeeMap, selectedIds],
  )

  const dynamicColumns = useMemo(
    () =>
      CHIP_COLUMN_ATTRIBUTES.filter(
        (attribute) => attribute !== 'Title' && filters.some((filter) => filter.attribute === attribute),
      ),
    [filters],
  )

  const allVisibleSelected =
    visibleEmployees.length > 0 && visibleEmployees.every((employee) => selectedIds.has(employee.id))
  const allFilteredSelected =
    filteredEmployees.length > 0 && filteredEmployees.every((employee) => selectedIds.has(employee.id))
  const selectedInViewCount = visibleEmployees.filter((employee) => selectedIds.has(employee.id)).length
  const selectedOutsideViewCount = Math.max(0, selectedIds.size - selectedInViewCount)
  const canContinue = selectedIds.size > 0
  const hasAnyFilter = filters.length > 0

  useEffect(() => {
    setVisibleRows(50)
    setTableFocusIndex(0)
  }, [filters])

  useEffect(() => {
    if (sortKey !== 'name' && sortKey !== 'title' && !dynamicColumns.includes(sortKey)) {
      setSortKey('name')
      setSortDir('asc')
    }
  }, [dynamicColumns, sortKey])

  useEffect(() => {
    if (!pickerOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [pickerOpen])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTextInput) {
        event.preventDefault()
        openAddFilterPicker()
        return
      }
      if (event.key === 'Escape') {
        setPickerOpen(false)
        return
      }
      if (!hasAnyFilter || visibleEmployees.length === 0 || isTextInput) return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setTableFocusIndex((previous) => Math.min(visibleEmployees.length - 1, previous + 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setTableFocusIndex((previous) => Math.max(0, previous - 1))
      } else if (event.key === ' ') {
        event.preventDefault()
        const focusedEmployee = visibleEmployees[tableFocusIndex]
        if (focusedEmployee) toggleSelected(focusedEmployee.id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hasAnyFilter, tableFocusIndex, visibleEmployees])

  useEffect(() => {
    if (!nameEditing) return
    nameInputRef.current?.focus()
  }, [nameEditing])

  function showToast(message: string) {
    const id = Date.now()
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    setToast({ id, message })
    toastTimerRef.current = window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
      toastTimerRef.current = null
    }, 1800)
  }

  function showUndoToast(message: string, onUndo: () => void) {
    const id = Date.now()
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    setToast({ id, message, actionLabel: 'Undo', onAction: onUndo })
    toastTimerRef.current = window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
      toastTimerRef.current = null
    }, 5000)
  }

  function openAddFilterPicker() {
    setEditingFilterId(null)
    setDraft(createEmptyDraft())
    setPickerStep('attribute')
    setPickerOpen(true)
    addFilterButtonRef.current?.focus()
  }

  function openEditFilterPicker(filter: WorklistFilter) {
    setEditingFilterId(filter.id)
    setDraft({
      attribute: filter.attribute,
      operator: filter.operator,
      value: filter.value,
      optionSearch: '',
    })
    setPickerStep('value')
    setPickerOpen(true)
  }

  function handleAttributePick(attribute: WorklistFilter['attribute']) {
    const schema = FILTER_SCHEMA_BY_ATTRIBUTE.get(attribute)
    if (!schema) return
    setDraft({
      attribute,
      operator: schema.operators[0],
      value: getDefaultValue(schema),
      optionSearch: '',
    })
    setPickerStep('value')
  }

  function upsertFilterFromDraft() {
    if (!draft.attribute) return
    const nextFilter: WorklistFilter = {
      id: editingFilterId || `filter-${Math.random().toString(36).slice(2, 8)}`,
      attribute: draft.attribute,
      operator: draft.operator,
      value: draft.value,
    }
    setFilters((previous) => {
      if (!editingFilterId) return [...previous, nextFilter]
      return previous.map((item) => (item.id === editingFilterId ? nextFilter : item))
    })
    setPickerOpen(false)
    setPickerStep('attribute')
    setEditingFilterId(null)
    setDraft(createEmptyDraft())
  }

  function removeFilter(filterId: string) {
    const removedIndex = filters.findIndex((item) => item.id === filterId)
    if (removedIndex < 0) return
    const removed = filters[removedIndex]
    setFilters((previous) => previous.filter((item) => item.id !== filterId))
    showUndoToast('Filter removed.', () => {
      setFilters((previous) => {
        if (previous.some((item) => item.id === removed.id)) return previous
        const next = [...previous]
        next.splice(Math.min(removedIndex, next.length), 0, removed)
        return next
      })
    })
  }

  function toggleSelected(employeeId: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (next.has(employeeId)) next.delete(employeeId)
      else next.add(employeeId)
      return next
    })
  }

  function toggleSelectAllVisible() {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (allVisibleSelected) {
        visibleEmployees.forEach((employee) => next.delete(employee.id))
      } else {
        visibleEmployees.forEach((employee) => next.add(employee.id))
      }
      return next
    })
  }

  function selectAllMatches() {
    if (filteredEmployees.length === 0) return
    setSelectedIds((previous) => {
      const next = new Set(previous)
      filteredEmployees.forEach((employee) => next.add(employee.id))
      return next
    })
  }

  function clearCurrentMatchSelection() {
    if (filteredEmployees.length === 0) return
    const previousSelection = new Set(selectedIds)
    setSelectedIds((previous) => {
      const next = new Set(previous)
      filteredEmployees.forEach((employee) => next.delete(employee.id))
      return next
    })
    showUndoToast('Match selection cleared.', () => {
      setSelectedIds(new Set(previousSelection))
    })
  }

  function clearSelectionWithUndo() {
    if (selectedIds.size === 0) return
    const previousSelection = new Set(selectedIds)
    setSelectedIds(new Set())
    showUndoToast('Selection cleared.', () => {
      setSelectedIds(new Set(previousSelection))
    })
  }

  function handleSort(key: 'name' | 'title' | (typeof CHIP_COLUMN_ATTRIBUTES)[number]) {
    if (sortKey === key) {
      setSortDir((previous) => (previous === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  return (
    <div className="h-screen bg-rippling-surface text-rippling-ink flex flex-col">
      <WorklistStepTopBar
        worklistName={worklistName}
        nameEditing={nameEditing}
        canContinue={canContinue}
        selectedCount={selectedIds.size}
        onNameChange={setWorklistName}
        onEditName={setNameEditing}
        onSaveDraft={() => showToast('Draft saved.')}
        onBack={onBack}
        nameInputRef={nameInputRef}
      />

      <main className="flex-1 overflow-auto px-5 pt-5 pb-28">
        <WorklistStepFilterBar
          filters={filters}
          pickerOpen={pickerOpen}
          pickerStep={pickerStep}
          draft={draft}
          scopedCategoricalOptions={scopedCategoricalOptions}
          pickerRef={pickerRef}
          addFilterButtonRef={addFilterButtonRef}
          onOpenAddFilter={openAddFilterPicker}
          onOpenEditFilter={openEditFilterPicker}
          onRemoveFilter={removeFilter}
          onSetPickerStep={setPickerStep}
          onSetPickerOpen={setPickerOpen}
          onDraftChange={(updater) => setDraft(updater)}
          onAttributePick={handleAttributePick}
          onApplyFilter={upsertFilterFromDraft}
        />

        {hasAnyFilter && (
          <div className="max-w-[1080px] mx-auto">
            <WorklistStepResultsTable
              filteredEmployees={filteredEmployees}
              visibleEmployees={visibleEmployees}
              dynamicColumns={dynamicColumns}
              selectedIds={selectedIds}
              allVisibleSelected={allVisibleSelected}
              tableFocusIndex={tableFocusIndex}
              visibleRows={visibleRows}
              sortKey={sortKey}
              sortDir={sortDir}
              selectedInViewCount={selectedInViewCount}
              selectedOutsideViewCount={selectedOutsideViewCount}
              onSetTableFocusIndex={setTableFocusIndex}
              onToggleSelected={toggleSelected}
              onToggleSelectAllVisible={toggleSelectAllVisible}
              onSelectAllMatches={selectAllMatches}
              onClearCurrentMatchSelection={clearCurrentMatchSelection}
              onClearSelection={clearSelectionWithUndo}
              onLoadMore={() => setVisibleRows((previous) => Math.min(previous + 50, filteredEmployees.length))}
              onSort={handleSort}
              onReviewSelection={() => setExpandedTray(true)}
              allFilteredSelected={allFilteredSelected}
            />
          </div>
        )}
      </main>

      <WorklistStepSelectionTray
        selectedCount={selectedIds.size}
        selectedEmployees={selectedEmployees}
        selectedInViewCount={selectedInViewCount}
        selectedOutsideViewCount={selectedOutsideViewCount}
        expanded={expandedTray}
        onToggleExpanded={() => setExpandedTray((previous) => !previous)}
        onToggleSelected={toggleSelected}
        onClearAll={clearSelectionWithUndo}
      />

      {toast && (
        <div className="fixed top-16 right-4 px-3 py-2 rounded-md bg-rippling-plum text-white text-[12.5px] flex items-center gap-3">
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              className="underline underline-offset-2 text-white/95 hover:text-white font-medium"
              onClick={() => {
                toast.onAction?.()
                setToast(null)
                if (toastTimerRef.current) {
                  window.clearTimeout(toastTimerRef.current)
                  toastTimerRef.current = null
                }
              }}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
