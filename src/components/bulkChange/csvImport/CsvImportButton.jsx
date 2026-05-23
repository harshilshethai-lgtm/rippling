import { useState } from 'react'
import { FileUp } from 'lucide-react'
import CsvImportModal from './CsvImportModal'
import { classNames } from '../../../lib/utils'

/**
 * Two visual variants:
 *  - "header": prominent plum-tinted button in the BulkChangePage header.
 *  - "card": dashed chip style used inside EmptyState quick-action row.
 */
export default function CsvImportButton({ variant = 'header', onImported }) {
  const [open, setOpen] = useState(false)

  function handleConfirm({ resolvedIds, missedRows }) {
    setOpen(false)
    onImported?.({ resolvedIds, missedRows })
  }

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={classNames(
            'group relative inline-flex items-center gap-2 h-8 pl-2.5 pr-3.5 rounded-md text-[13px] font-semibold transition-all duration-150',
            'bg-gradient-to-b from-rippling-plum/10 to-rippling-plum/5',
            'border border-rippling-plum/30 text-rippling-plum',
            'hover:from-rippling-plum/20 hover:to-rippling-plum/10 hover:border-rippling-plum/60 hover:shadow-sm',
            'shadow-[0_1px_2px_rgba(72,17,56,0.08)]',
          )}
        >
          <span className="flex items-center justify-center w-5 h-5 rounded bg-rippling-plum/10 group-hover:bg-rippling-plum/20 transition-colors">
            <FileUp size={12} strokeWidth={2.25} className="text-rippling-plum" />
          </span>
          CSV Upload
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={classNames(
            'inline-flex items-center gap-1.5 rounded-full text-[12px] font-medium transition-colors px-2.5 py-1',
            'border border-rippling-plum/30 bg-rippling-plum/5 text-rippling-plum',
            'hover:bg-rippling-plum/10 hover:border-rippling-plum/50',
          )}
        >
          <FileUp size={11} strokeWidth={2} />
          <span>CSV Upload</span>
        </button>
      )}

      {open && (
        <CsvImportModal onClose={() => setOpen(false)} onConfirm={handleConfirm} />
      )}
    </>
  )
}
