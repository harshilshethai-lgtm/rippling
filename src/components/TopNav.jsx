import { useState, useEffect } from 'react'
import { Search, HelpCircle, Bell, Sparkles, ChevronDown, PersonStanding, Inbox } from 'lucide-react'
import { classNames } from '../lib/utils'

const SEARCH_ROTATE_WORDS = ['people', 'pages', 'apps', 'reports', 'custom objects']

export default function TopNav() {
  return (
    <header className="h-12 bg-rippling-plum text-white flex items-center px-3 gap-2 flex-shrink-0 select-none overflow-visible z-20">
      {/* Logo */}
      <div className="flex items-center gap-2 pr-3">
        <div className="w-7 h-7 rounded-md bg-white/0 flex items-center justify-center">
          <RipplingLogo />
        </div>
      </div>

      {/* Menu */}
      <button
        type="button"
        className="topnav-menu-btn h-8 px-3 rounded-md flex items-center gap-2 text-[13px] font-medium"
      >
        <span>Menu</span>
        <ChevronDown size={14} strokeWidth={2.25} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-2xl mx-auto px-3">
        <GlobalSearch />
      </div>

      {/* Right side icons */}
      <div className="flex items-center gap-2 overflow-visible">
        <IconButton label="Support">
          <HelpCircle size={18} strokeWidth={1.75} />
        </IconButton>
        <IconButton label="Accessibility">
          <PersonStanding size={18} strokeWidth={1.75} />
        </IconButton>
        <IconButton label="Inbox" badge="3">
          <Inbox size={18} strokeWidth={1.75} />
        </IconButton>
        <IconButton label="Notifications" badge="9+">
          <Bell size={18} strokeWidth={1.75} />
        </IconButton>
        <IconButton label="Rippling AI" highlighted className="ml-0.5">
          <Sparkles size={18} strokeWidth={1.75} className="text-rippling-accent" />
        </IconButton>

        {/* Divider */}
        <div className="w-px h-6 bg-white/20 mx-1.5" />

        {/* Company switcher */}
        <button
          type="button"
          className="topnav-menu-btn h-8 pl-3 pr-2 rounded-md flex items-center gap-2 text-[13px] font-medium"
        >
          <span>Acme, Inc.</span>
          <div className="w-6 h-6 rounded-full avatar-gradient-a flex items-center justify-center text-[10px] font-semibold">
            JD
          </div>
        </button>
      </div>
    </header>
  )
}

function GlobalSearch() {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)

  const showAnimatedPlaceholder = !value && !focused
  const currentWord = SEARCH_ROTATE_WORDS[wordIndex]

  useEffect(() => {
    if (!showAnimatedPlaceholder) return
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % SEARCH_ROTATE_WORDS.length)
    }, 3000)
    return () => clearInterval(id)
  }, [showAnimatedPlaceholder])

  return (
    <div className="relative">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none z-10"
        strokeWidth={2.25}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={`Search for ${currentWord}`}
        className="topnav-search relative w-full h-8 rounded-md border-2 border-white/40 bg-white/10 pl-9 pr-3 text-[13px] text-white outline-none focus:border-white/70 focus:bg-white/25 focus:ring-2 focus:ring-white/25"
      />
      {showAnimatedPlaceholder && (
        <div
          aria-hidden
          className="absolute inset-0 flex items-center pl-9 pr-3 text-[13px] pointer-events-none overflow-hidden"
        >
          <span className="shrink-0 text-white/55">Search for&nbsp;</span>
          <span key={wordIndex} className="text-white/80 font-medium truncate anim-search-word">
            {currentWord}
          </span>
          <span className="shrink-0 text-white/55">...</span>
        </div>
      )}
    </div>
  )
}

function IconButton({ children, badge, label, highlighted, className }) {
  return (
    <div className={classNames('relative shrink-0 group', className)}>
      <button
        type="button"
        title={label}
        aria-label={label}
      className={classNames(
        'topnav-btn relative w-8 h-8 rounded-md flex items-center justify-center',
        highlighted &&
          'topnav-btn-highlighted bg-white/15 ring-1 ring-inset ring-white/35 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_0_12px_rgba(217,70,168,0.4)]'
      )}
      >
        {children}
        {badge && (
          <span className="absolute -top-1 -right-1 z-10 bg-rippling-red-dot text-white text-[9px] font-semibold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center pointer-events-none">
            {badge}
          </span>
        )}
      </button>
      {label && (
        <span
          role="tooltip"
          className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-md bg-rippling-ink text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 z-[100] shadow-lg"
        >
          {label}
        </span>
      )}
    </div>
  )
}

function RipplingLogo() {
  // The "RR" mark from the screenshots — three vertical wavy bars
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 8 Q 8 12, 6 16 T 6 24"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 8 Q 16 12, 14 16 T 14 24"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="22" y1="8" x2="22" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
