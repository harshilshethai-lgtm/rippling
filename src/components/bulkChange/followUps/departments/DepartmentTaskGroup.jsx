import { Plus } from 'lucide-react'
import TaskRow from './TaskRow'
import { FIELDS_BY_KEY } from '../../defineChanges/fieldSchema'
import { classNames } from '../../../../lib/utils'

/**
 * One "Because of: <field>" group inside a department panel.
 *
 * Renders every task whose sourceFieldKey === fieldKey, in their stored
 * order. Inline "+ Add a task for X" sits at the bottom so user-added rows
 * always land inside the group they belong to.
 */
export default function DepartmentTaskGroup({
  fieldKey,
  tasks,
  onUpdateTask,
  onRemoveTask,
  onResetDescription,
  onAddTask,
}) {
  const fieldLabel = FIELDS_BY_KEY.get(fieldKey)?.label ?? fieldKey

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wide font-semibold text-rippling-muted">
          Because of:
        </span>
        <span
          className={classNames(
            'inline-flex items-center h-5 px-1.5 rounded-md bg-rippling-chip text-rippling-plum text-[11px] font-medium',
          )}
        >
          {fieldLabel}
        </span>
        <span className="text-[11px] text-rippling-muted">
          {tasks.length} task{tasks.length === 1 ? '' : 's'}
        </span>
      </div>

      <ul className="space-y-1.5">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskRow
              task={task}
              onUpdate={(patch) => onUpdateTask(task.id, patch)}
              onRemove={() => onRemoveTask(task.id)}
              onResetDescription={() => onResetDescription(task.id)}
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onAddTask(fieldKey)}
        className="inline-flex items-center gap-1.5 h-7 pl-2 pr-3 rounded-md border border-dashed border-rippling-line text-[12px] text-rippling-muted hover:border-rippling-plum/50 hover:text-rippling-plum transition-colors"
      >
        <Plus size={11} strokeWidth={2} />
        Add a task for &ldquo;{fieldLabel}&rdquo;
      </button>
    </div>
  )
}
