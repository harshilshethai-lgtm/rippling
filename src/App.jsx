import { useState } from 'react'
import TopNav from './components/TopNav'
import Sidebar from './components/Sidebar'
import PeopleListPage from './components/PeopleListPage'
import EmployeeProfile from './components/EmployeeProfile'
import BulkChangePage from './components/BulkChangePage'
import WorklistsPage from './components/WorklistsPage'

export default function App() {
  const [view, setView] = useState({ name: 'list' })

  function handleSidebarNavigate(viewName) {
    if (viewName === 'list') setView({ name: 'list' })
    else if (viewName === 'worklists') setView({ name: 'worklists' })
  }

  return (
    <div className="h-screen flex flex-col bg-rippling-surface">
      <TopNav />

      <div className="flex flex-1 min-h-0">
        <Sidebar currentView={view.name} onNavigate={handleSidebarNavigate} />

        <main className="flex-1 flex flex-col overflow-hidden bg-rippling-surface">
          {view.name === 'list' && <PeopleListPage onNavigate={setView} />}
          {view.name === 'bulk' && (
            <BulkChangePage
              onNavigate={setView}
              initialEmployeeIds={view.initialEmployeeIds}
              initialFilters={view.initialFilters}
              initialSearch={view.initialSearch}
            />
          )}
          {view.name === 'profile' && (
            <EmployeeProfile employeeId={view.employeeId} onNavigate={setView} />
          )}
          {view.name === 'worklists' && <WorklistsPage onNavigate={setView} />}
        </main>
      </div>
    </div>
  )
}
