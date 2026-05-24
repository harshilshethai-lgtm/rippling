import { useEffect, useState } from 'react'
import {
  Home,
  Users,
  CreditCard,
  Heart,
  Calendar,
  Laptop,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  Settings,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { classNames } from '../lib/utils'

const PEOPLE_CHILDREN = [
  { id: 'list', label: 'List', view: 'list' },
  { id: 'bulk', label: 'Bulk Edit', view: 'worklists' },
]

const PEOPLE_VIEWS = new Set(['list', 'worklists', 'profile', 'bulk'])

function sectionsFor() {
  return [
    {
      label: null,
      items: [{ icon: Home, label: 'Dashboard', key: 'dashboard' }],
    },
    {
      label: 'HR',
      items: [
        { icon: Users, label: 'People', key: 'people', children: PEOPLE_CHILDREN },
        { icon: TrendingUp, label: 'Performance', key: 'performance' },
        { icon: Calendar, label: 'Time Off', key: 'timeOff' },
        { icon: Briefcase, label: 'Recruiting', key: 'recruiting' },
      ],
    },
    {
      label: 'Finance',
      items: [
        { icon: CreditCard, label: 'Payroll', key: 'payroll' },
        { icon: Heart, label: 'Benefits', key: 'benefits' },
        { icon: ShieldCheck, label: 'Expenses', key: 'expenses' },
      ],
    },
    {
      label: 'IT',
      items: [
        { icon: Laptop, label: 'Devices', key: 'devices' },
        { icon: Settings, label: 'App Management', key: 'appManagement' },
      ],
    },
  ]
}

export default function Sidebar({ currentView = 'list', onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)
  const sections = sectionsFor()

  // Auto-expand People whenever its active child is the current view
  const peopleActive = PEOPLE_VIEWS.has(currentView)
  const [expanded, setExpanded] = useState({ people: peopleActive })

  useEffect(() => {
    if (peopleActive) {
      setExpanded((prev) => (prev.people ? prev : { ...prev, people: true }))
    }
  }, [peopleActive])

  function handleParentClick(item) {
    if (!item.children) return
    if (collapsed) {
      // Collapsed sidebar: navigate to first child without toggling expansion
      onNavigate?.(item.children[0].view)
      return
    }
    const willExpand = !expanded[item.key]
    setExpanded((prev) => ({ ...prev, [item.key]: willExpand }))
    if (willExpand && item.children[0]?.view) {
      onNavigate?.(item.children[0].view)
    }
  }

  function handleChildClick(child) {
    onNavigate?.(child.view)
  }

  return (
    <aside
      className={classNames(
        'bg-white border-r border-rippling-line flex-shrink-0 flex flex-col transition-[width] duration-200 ease-out overflow-visible',
        collapsed ? 'w-[52px]' : 'w-56'
      )}
    >
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        {sections.map((section, i) => (
          <div
            key={i}
            className={classNames('mb-2', collapsed && i > 0 && 'pt-1 border-t border-rippling-line-2')}
          >
            {section.label && !collapsed && (
              <div className="px-2.5 pt-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-rippling-muted whitespace-nowrap">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const isPeople = item.key === 'people'
              const parentActive = isPeople && peopleActive
              const isExpanded = !!expanded[item.key]

              return (
                <div key={item.key ?? item.label}>
                  <NavItem
                    icon={item.icon}
                    label={item.label}
                    active={parentActive}
                    collapsed={collapsed}
                    hasChildren={!!item.children}
                    expanded={isExpanded}
                    onClick={() => handleParentClick(item)}
                  />

                  {item.children && !collapsed && isExpanded && (
                    <div className="mt-0.5 mb-1 ml-7 border-l border-rippling-line-2 pl-2 space-y-0.5">
                      {item.children.map((child) => (
                        <ChildNavItem
                          key={child.id}
                          label={child.label}
                          active={currentView === child.view}
                          onClick={() => handleChildClick(child)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-rippling-line p-2 space-y-1">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={classNames(
            'flex items-center rounded-md text-rippling-muted ui-interactive hover:text-rippling-ink-2 transition-colors',
            collapsed ? 'w-9 h-9 justify-center mx-auto' : 'w-full gap-2 px-2.5 py-1.5 text-[12px]'
          )}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} strokeWidth={1.75} />
          ) : (
            <>
              <PanelLeftClose size={16} strokeWidth={1.75} />
              <span className="flex-1 text-left">Collapse</span>
            </>
          )}
        </button>

        <button
          type="button"
          title="Admin Settings"
          className={classNames(
            'flex items-center rounded-md ui-interactive text-[13px] text-rippling-ink-2 transition-colors group',
            collapsed ? 'w-9 h-9 justify-center mx-auto' : 'w-full gap-2 px-2.5 py-1.5'
          )}
        >
          <Settings size={15} strokeWidth={1.75} className="shrink-0 text-rippling-muted" />
          {!collapsed && <span className="whitespace-nowrap">Admin Settings</span>}
        </button>
      </div>
    </aside>
  )
}

function NavItem({ icon: Icon, label, active, collapsed, hasChildren, expanded, onClick }) {
  return (
    <div className={classNames('relative group', collapsed && 'flex justify-center')}>
      <button
        type="button"
        onClick={onClick}
        title={collapsed ? label : undefined}
        aria-label={label}
        aria-expanded={hasChildren ? expanded : undefined}
        className={classNames(
          'flex items-center rounded-md text-[13px] transition-colors',
          collapsed ? 'w-9 h-9 justify-center' : 'gap-2.5 w-full px-2.5 py-1.5',
          active
            ? 'bg-rippling-chip text-rippling-plum font-medium'
            : 'text-rippling-ink-2 ui-interactive'
        )}
      >
        <Icon
          size={15}
          strokeWidth={1.75}
          className={classNames(
            'shrink-0',
            active ? 'text-rippling-plum' : 'text-rippling-muted group-hover:text-rippling-ink-2'
          )}
        />
        {!collapsed && (
          <>
            <span className="flex-1 text-left whitespace-nowrap">{label}</span>
            {hasChildren ? (
              expanded ? (
                <ChevronDown size={13} strokeWidth={2} className="shrink-0 text-rippling-muted" />
              ) : (
                <ChevronRight size={13} strokeWidth={2} className="shrink-0 text-rippling-muted" />
              )
            ) : (
              active && <ChevronRight size={13} strokeWidth={2} className="shrink-0" />
            )}
          </>
        )}
      </button>
      {collapsed && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md bg-rippling-ink text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg"
        >
          {label}
        </span>
      )}
    </div>
  )
}

function ChildNavItem({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'flex items-center w-full px-2.5 py-1 rounded-md text-[12.5px] transition-colors text-left',
        active
          ? 'bg-rippling-chip text-rippling-plum font-medium'
          : 'text-rippling-ink-2 ui-interactive hover:text-rippling-ink'
      )}
    >
      <span className="flex-1 truncate">{label}</span>
      {active && <ChevronRight size={12} strokeWidth={2} className="shrink-0" />}
    </button>
  )
}
