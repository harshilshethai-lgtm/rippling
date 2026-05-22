import { useMemo, useState } from 'react'
import PageHeader from './PageHeader'
import ActiveFilterChips from './ActiveFilterChips'
import EmployeeTable from './EmployeeTable'
import FilterPanel from './FilterPanel'
import SelectionBar from './SelectionBar'
import { EMPLOYEES, matchesPeopleTab } from '../data/employees'

const EMPTY_FILTERS = {
  department: [],
  location: [],
  manager: [],
  employmentType: [],
  status: [],
}

export default function PeopleListPage({ onNavigate }) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [peopleTab, setPeopleTab] = useState('all')

  const tabEmployees = useMemo(
    () => EMPLOYEES.filter((emp) => matchesPeopleTab(emp, peopleTab)),
    [peopleTab]
  )

  const filteredEmployees = useMemo(() => {
    return tabEmployees.filter((emp) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const haystack = [emp.fullName, emp.email, emp.title, emp.manager, emp.department]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }

      if (filters.department.length && !filters.department.includes(emp.department)) return false
      if (filters.location.length && !filters.location.includes(emp.location)) return false
      if (filters.manager.length && !filters.manager.includes(emp.manager)) return false
      if (filters.employmentType.length && !filters.employmentType.includes(emp.employmentType))
        return false
      if (filters.status.length && !filters.status.includes(emp.status)) return false
      return true
    })
  }, [tabEmployees, search, filters])

  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0)

  function handleStartBulkChange() {
    const ids = selected.size > 0 ? [...selected] : filteredEmployees.map((e) => e.id)
    console.log('Start bulk change for', ids.length, 'people')
    alert(
      `Bulk change entry point\n\nScope: ${ids.length} ${ids.length === 1 ? 'person' : 'people'}\n\n` +
        `From here, the bulk-change wizard would open. This is the scaffolding entry — wire your flow up to this handler.`
    )
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <PageHeader
          totalCount={tabEmployees.length}
          filteredCount={filteredEmployees.length}
          peopleTab={peopleTab}
          onPeopleTabChange={setPeopleTab}
          search={search}
          setSearch={setSearch}
          onOpenFilters={() => setFilterPanelOpen(true)}
          activeFilterCount={activeFilterCount}
          selectedCount={selected.size}
          onStartBulkChange={handleStartBulkChange}
        />

        {activeFilterCount > 0 && <ActiveFilterChips filters={filters} setFilters={setFilters} />}

        <EmployeeTable
          employees={filteredEmployees}
          selected={selected}
          setSelected={setSelected}
          onRowClick={(emp) => onNavigate({ name: 'profile', employeeId: emp.id })}
        />

        <SelectionBar
          selectedCount={selected.size}
          onClear={() => setSelected(new Set())}
          onStartBulkChange={handleStartBulkChange}
        />
      </div>

      <FilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={filters}
        setFilters={setFilters}
      />
    </>
  )
}
