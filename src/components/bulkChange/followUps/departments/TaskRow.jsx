import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronRight, Clock, Lock, RotateCcw, Trash2, UserPlus } from 'lucide-react'
import TaskDueDateField from './TaskDueDateField'
import { classNames } from '../../../../lib/utils'

/**
 * Uniform task row — same layout for every department, every group.
 *
 * Anatomy (locked order):
 *   ☐  Title (system tasks: locked; user tasks: editable)
 *      [Due date]  •  [Description (expandable, editable, with Reset)]
 *      [delete]
 *
 * Owner is intentionally absent — it lives at the department panel level
 * because each department has a single owner that applies to every task
 * inside it (per the implementation contract).
 */
export default function TaskRow({
  task,
  onUpdate,
  onRemove,
  onResetDescription,
}) {
  const [expanded, setExpanded] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [draftDesc, setDraftDesc] = useState(task.description)
  const [draftTitle, setDraftTitle] = useState(task.title)
  const [editingTitle, setEditingTitle] = useState(false)
  const titleInputRef = useRef(null)
  const descTextareaRef = useRef(null)

  useEffect(() => {
    setDraftDesc(task.description)
  }, [task.description])

  useEffect(() => {
    setDraftTitle(task.title)
  }, [task.title])

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus()
  }, [editingTitle])

  useEffect(() => {
    if (editingDesc) {
      const t = descTextareaRef.current
      t?.focus()
      if (t) {
        const len = t.value.length
        t.setSelectionRange(len, len)
      }
    }
  }, [editingDesc])

  const hasDescription = task.description?.trim().length > 0
  const showResetChip = task.isSystem && task.descriptionOverridden

  function commitDescription() {
    setEditingDesc(false)
    if (draftDesc !== task.description) onUpdate({ description: draftDesc })
  }

  function commitTitle() {
    setEditingTitle(false)
    const trimmed = draftTitle.trim()
    if (!trimmed) {
      setDraftTitle(task.title)
      return
    }
    if (trimmed !== task.title) onUpdate({ title: trimmed })
  }

  return (
    <div
      className={classNames(
        'rounded-lg border bg-white transition-colors',
        task.dueDate ? 'border-rippling-line' : 'border-rippling-line border-dashed',
      )}
    >
      {/* Main row */}
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        {/* Pseudo-checkbox — purely visual gate state for now */}
        <button
          type="button"
          aria-label={`Task: ${task.title}`}
          className="mt-[3px] h-4 w-4 rounded-[4px] border border-rippling-line bg-white shrink-0 hover:border-rippling-plum/60 transition-colors"
          tabIndex={-1}
        />

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              {task.isSystem ? (
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[13px] font-medium text-rippling-ink leading-snug"
                    title={task.title}
                  >
                    {task.title}
                  </span>
                  <span
                    className="inline-flex items-center gap-0.5 h-[18px] px-1.5 rounded-full bg-rippling-chip text-rippling-plum text-[10px] font-medium shrink-0"
                    title="System-recommended task — title is locked; add a custom task if you need different wording."
                  >
                    <Lock size={9} strokeWidth={2} />
                    System
                  </span>
                </div>
              ) : editingTitle ? (
                <input
                  ref={titleInputRef}
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); commitTitle() }
                    if (e.key === 'Escape') { e.preventDefault(); setDraftTitle(task.title); setEditingTitle(false) }
                  }}
                  placeholder="Describe the task in a few words"
                  className="w-full text-[13px] font-medium text-rippling-ink bg-transparent border-b border-rippling-plum/40 focus:outline-none focus:border-rippling-plum"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingTitle(true)}
                  className={classNames(
                    'text-[13px] font-medium leading-snug text-left w-full truncate hover:text-rippling-plum transition-colors',
                    task.title ? 'text-rippling-ink' : 'text-rippling-muted italic',
                  )}
                >
                  {task.title || 'Untitled task — click to name'}
                </button>
              )}

              {/* Acknowledgment actions — shown when task is pending */}
              {task.taskAction === 'pending' && (
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdate({ taskAction: 'accepted' })}
                    className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-emerald-50 border border-emerald-200 text-[11.5px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <Check size={10} strokeWidth={2.5} />
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ taskAction: 'reassigned' })}
                    className="inline-flex items-center gap-1 h-6 px-2 rounded-md border border-rippling-line bg-white text-[11.5px] font-medium text-rippling-muted hover:text-rippling-ink hover:bg-rippling-surface transition-colors"
                  >
                    <UserPlus size={10} strokeWidth={2} />
                    Reassign
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ taskAction: 'deferred' })}
                    className="inline-flex items-center gap-1 h-6 px-2 rounded-md border border-rippling-line bg-white text-[11.5px] font-medium text-rippling-muted hover:text-rippling-ink hover:bg-rippling-surface transition-colors"
                  >
                    <Clock size={10} strokeWidth={2} />
                    Defer
                  </button>
                </div>
              )}

              {/* Acknowledged state badge */}
              {task.taskAction && task.taskAction !== 'pending' && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={classNames(
                    'inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10.5px] font-medium',
                    task.taskAction === 'accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    task.taskAction === 'deferred' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200',
                  )}>
                    {task.taskAction === 'accepted' && <Check size={9} strokeWidth={2.5} />}
                    {task.taskAction === 'accepted' ? 'Accepted' :
                     task.taskAction === 'deferred' ? 'Deferred' : 'Reassigned'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdate({ taskAction: 'pending' })}
                    className="text-[10.5px] text-rippling-muted hover:text-rippling-plum transition-colors"
                  >
                    Undo
                  </button>
                </div>
              )}

              {/* Meta line: due date + expand toggle */}
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <TaskDueDateField
                  value={task.dueDate}
                  onChange={(iso) => onUpdate({ dueDate: iso })}
                />

                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="inline-flex items-center gap-1 h-6 px-1.5 text-[11.5px] text-rippling-muted hover:text-rippling-ink rounded-md hover:bg-rippling-surface transition-colors"
                >
                  {expanded ? (
                    <ChevronDown size={11} strokeWidth={2} />
                  ) : (
                    <ChevronRight size={11} strokeWidth={2} />
                  )}
                  Description
                  {!expanded && hasDescription && (
                    <span className="text-rippling-muted/70 truncate max-w-[180px]">
                      · {task.description}
                    </span>
                  )}
                </button>

                {showResetChip && (
                  <button
                    type="button"
                    onClick={onResetDescription}
                    className="inline-flex items-center gap-1 h-6 px-1.5 text-[11px] text-rippling-muted hover:text-rippling-plum rounded-md hover:bg-rippling-surface transition-colors"
                    title="Reset description to the system default"
                  >
                    <RotateCcw size={10} strokeWidth={2} />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Row actions */}
            <button
              type="button"
              onClick={onRemove}
              className="shrink-0 h-6 w-6 rounded-md flex items-center justify-center text-rippling-muted hover:text-red-600 hover:bg-red-50 transition-colors"
              aria-label="Delete task"
              title={task.isSystem ? 'Delete this system-recommended task' : 'Delete task'}
            >
              <Trash2 size={12} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* Description expansion */}
      {expanded && (
        <div className="px-3 pb-3 ml-7 -mt-1">
          {editingDesc ? (
            <textarea
              ref={descTextareaRef}
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              onBlur={commitDescription}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { e.preventDefault(); setDraftDesc(task.description); setEditingDesc(false) }
                if ((e.key === 'Enter' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); commitDescription() }
              }}
              rows={3}
              placeholder="Add a description for whoever will own this task…"
              className="w-full text-[12.5px] text-rippling-ink-2 leading-relaxed bg-rippling-surface border border-rippling-line rounded-md px-2.5 py-2 focus:outline-none focus:border-rippling-plum/50 focus:bg-white resize-y"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingDesc(true)}
              className={classNames(
                'w-full text-left text-[12.5px] leading-relaxed bg-rippling-surface border border-rippling-line rounded-md px-2.5 py-2 hover:border-rippling-plum/40 transition-colors',
                hasDescription ? 'text-rippling-ink-2' : 'text-rippling-muted italic',
              )}
              title="Click to edit"
            >
              {task.description || 'Add a description for whoever will own this task…'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
