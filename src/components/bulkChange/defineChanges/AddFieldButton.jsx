import { useState } from 'react'
import { Plus } from 'lucide-react'
import { classNames } from '../../../lib/utils'
import ChangeFieldPicker from './ChangeFieldPicker'

/**
 * "Add property" trigger for the Define change set page.
 *
 * Opens the full-screen Linear-style ChangeFieldPicker modal (portal-rendered
 * to document.body) where the user can pick from any section and apply all
 * selections at once.
 */
export default function AddFieldButton({
  alreadySelectedKeys = [],
  onAddFields,
  variant = 'primary',
  size = 'default',
}) {
  const [open, setOpen] = useState(false)

  const isPrimary = variant === 'primary'
  const isLarge = size === 'large'

  function handleApply(keys) {
    if (keys.length === 0) return
    onAddFields?.(keys)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className={classNames(
          'inline-flex items-center gap-1.5 rounded-md font-medium transition-colors',
          isLarge ? 'h-9 px-4 text-[13px]' : 'h-8 text-[12.5px]',
          isPrimary
            ? open
              ? 'bg-rippling-plum-hover text-white shadow-sm px-3'
              : 'bg-rippling-plum text-white hover:bg-rippling-plum-hover shadow-sm px-3'
            : open
              ? 'border border-rippling-plum/40 bg-rippling-chip text-rippling-plum px-2.5'
              : 'border border-rippling-line text-rippling-ink-2 hover:bg-rippling-surface-2 px-2.5',
          isPrimary && isLarge && 'px-4',
        )}
      >
        <Plus size={isLarge ? 14 : 13} strokeWidth={2} />
        <span>Add property</span>
      </button>

      <ChangeFieldPicker
        open={open}
        alreadySelectedKeys={alreadySelectedKeys}
        onClose={() => setOpen(false)}
        onApply={handleApply}
      />
    </>
  )
}
