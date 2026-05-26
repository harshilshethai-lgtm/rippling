import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import TheProblemSlide from './slides/TheProblemSlide'
import AssumptionsSlide from './slides/AssumptionsSlide'
import ThePlatformSlide from './slides/ThePlatformSlide'
import TheDesignSlide from './slides/TheDesignSlide'

const SLIDES = [
  { id: 'problem', component: TheProblemSlide },
  { id: 'assumptions', component: AssumptionsSlide },
  { id: 'platform', component: ThePlatformSlide },
  { id: 'design', component: TheDesignSlide },
]

export default function SlidesPage() {
  const [index, setIndex] = useState(0)
  const SlideComponent = SLIDES[index].component

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-rippling-surface">
      {/* Slide content */}
      <div className="flex-1 overflow-auto px-8 py-8">
        <div className="w-full max-w-4xl mx-auto">
          <SlideComponent />
        </div>
      </div>

      {/* Navigation footer */}
      <div className="flex-shrink-0 border-t border-rippling-line bg-white px-8 py-3 flex items-center justify-between">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="h-8 px-3 rounded-md border border-rippling-line text-[13px] text-rippling-ink-2
                     flex items-center gap-1.5 font-medium transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed
                     hover:border-rippling-ink-2/40 hover:bg-rippling-surface-2"
        >
          <ChevronLeft size={14} strokeWidth={2} />
          Previous
        </button>

        <span className="text-[12.5px] text-rippling-muted font-medium tabular-nums">
          {index + 1} / {SLIDES.length}
        </span>

        <button
          onClick={() => setIndex((i) => Math.min(SLIDES.length - 1, i + 1))}
          disabled={index === SLIDES.length - 1}
          className="h-8 px-3 rounded-md bg-rippling-plum text-white text-[13px]
                     flex items-center gap-1.5 font-medium transition-colors shadow-sm
                     disabled:opacity-30 disabled:cursor-not-allowed
                     hover:bg-rippling-plum-hover"
        >
          Next
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
