import { useCallback, useEffect, useMemo } from 'react'
import { getDepartmentsForFieldKeys } from './fieldDepartmentMap'
import { getTaskTemplate, systemTaskId } from './departmentTaskTemplates'

/**
 * State model shape (owned by BulkChangePage and threaded down):
 *
 * tasksByDepartment: {
 *   [deptId]: Task[]
 * }
 * ownerByDepartment: {
 *   [deptId]: { id, name, role } | null
 * }
 *
 * Task: {
 *   id: string,                 // 'sys.<dept>.<field>' for system tasks; uuid-ish for user tasks
 *   title: string,
 *   description: string,
 *   dueDate: string | null,     // 'YYYY-MM-DD'
 *   sourceFieldKey: string,     // which selected field triggered this task
 *   isSystem: boolean,          // title is locked when true
 *   descriptionOverridden: boolean, // tracks whether user edited the default description
 * }
 *
 * Single-owner-per-department contract:
 *   The owner for a department applies to every task inside it. Task rows
 *   do not have their own owner picker. Setting an owner adds them as a
 *   workflow Collaborator via onAddCollaborator (one-way).
 */

function generateUserTaskId(deptId) {
  return `user.${deptId}.${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Manages task seeding and per-task mutations. Initialization is idempotent:
 * if a system task for (dept × field) already exists, it's preserved (so user
 * description edits and due-date assignments survive re-syncs).
 */
export function useDepartmentTasks({
  selectedFieldKeys,
  tasksByDepartment,
  setTasksByDepartment,
  ownerByDepartment,
  setOwnerByDepartment,
  onAddCollaborator,
}) {
  const activeMap = useMemo(
    () => getDepartmentsForFieldKeys(selectedFieldKeys),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedFieldKeys.join(',')],
  )

  // Sync: add missing system tasks, prune orphaned ones, drop user tasks
  // whose triggering field or department is no longer active.
  useEffect(() => {
    setTasksByDepartment((prev) => {
      const next = {}
      let changed = false

      for (const [deptId, fieldKeys] of activeMap) {
        const existing = prev[deptId] ?? []
        const desiredSystemIds = new Set(fieldKeys.map((fk) => systemTaskId(deptId, fk)))
        const activeFieldSet = new Set(fieldKeys)

        // Keep existing tasks that are still relevant
        const kept = []
        for (const task of existing) {
          if (task.isSystem) {
            if (desiredSystemIds.has(task.id)) kept.push(task)
            else changed = true
          } else if (activeFieldSet.has(task.sourceFieldKey)) {
            kept.push(task)
          } else {
            changed = true
          }
        }

        // Add any missing system tasks (preserve fieldKeys order so groups
        // render in the order the user selected fields)
        const haveIds = new Set(kept.map((t) => t.id))
        const merged = []
        for (const fk of fieldKeys) {
          const id = systemTaskId(deptId, fk)
          const existingTask = kept.find((t) => t.id === id)
          if (existingTask) {
            merged.push(existingTask)
          } else {
            const tpl = getTaskTemplate(fk, deptId)
            merged.push({
              id,
              title: tpl.title,
              description: tpl.description,
              dueDate: null,
              sourceFieldKey: fk,
              isSystem: true,
              descriptionOverridden: false,
              taskAction: 'pending',
            })
            changed = true
          }

          // Append any user tasks for this fieldKey, preserving their order
          for (const t of kept) {
            if (!t.isSystem && t.sourceFieldKey === fk) merged.push(t)
          }
        }

        next[deptId] = merged
      }

      // Drop departments that are no longer active
      for (const deptId of Object.keys(prev)) {
        if (!activeMap.has(deptId)) {
          changed = true
        }
      }

      return changed ? next : prev
    })

    // Clear owner for departments that are no longer active
    setOwnerByDepartment((prev) => {
      let changed = false
      const next = {}
      for (const [deptId, owner] of Object.entries(prev)) {
        if (activeMap.has(deptId)) next[deptId] = owner
        else changed = true
      }
      return changed ? next : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMap])

  // ── Per-department mutations ──────────────────────────────────────────

  const setOwner = useCallback(
    (deptId, person) => {
      setOwnerByDepartment((prev) => ({ ...prev, [deptId]: person ?? null }))
      if (person && onAddCollaborator) {
        onAddCollaborator(person)
      }
    },
    [setOwnerByDepartment, onAddCollaborator],
  )

  const clearOwner = useCallback(
    (deptId) => {
      setOwnerByDepartment((prev) => {
        if (!prev[deptId]) return prev
        const next = { ...prev }
        next[deptId] = null
        return next
      })
    },
    [setOwnerByDepartment],
  )

  const addUserTask = useCallback(
    (deptId, sourceFieldKey, initial = {}) => {
      setTasksByDepartment((prev) => {
        const existing = prev[deptId] ?? []
        const newTask = {
          id: generateUserTaskId(deptId),
          title: initial.title ?? '',
          description: initial.description ?? '',
          dueDate: initial.dueDate ?? null,
          sourceFieldKey,
          isSystem: false,
          descriptionOverridden: false,
          taskAction: 'pending',
        }

        // Insert after the last task in the same fieldKey group so it stays
        // visually inside that "Because of: X" block.
        const next = []
        let inserted = false
        for (let i = 0; i < existing.length; i++) {
          next.push(existing[i])
          const cur = existing[i]
          const nextTask = existing[i + 1]
          if (
            cur.sourceFieldKey === sourceFieldKey &&
            (!nextTask || nextTask.sourceFieldKey !== sourceFieldKey) &&
            !inserted
          ) {
            next.push(newTask)
            inserted = true
          }
        }
        if (!inserted) next.push(newTask)

        return { ...prev, [deptId]: next }
      })
    },
    [setTasksByDepartment],
  )

  const removeTask = useCallback(
    (deptId, taskId) => {
      setTasksByDepartment((prev) => {
        const existing = prev[deptId] ?? []
        const filtered = existing.filter((t) => t.id !== taskId)
        if (filtered.length === existing.length) return prev
        return { ...prev, [deptId]: filtered }
      })
    },
    [setTasksByDepartment],
  )

  const updateTask = useCallback(
    (deptId, taskId, patch) => {
      setTasksByDepartment((prev) => {
        const existing = prev[deptId] ?? []
        let changed = false
        const next = existing.map((t) => {
          if (t.id !== taskId) return t
          const merged = { ...t, ...patch }
          // If description is being patched and differs from the system
          // default, flip descriptionOverridden so the Reset chip shows.
          if ('description' in patch && t.isSystem) {
            const tpl = getTaskTemplate(t.sourceFieldKey, deptId)
            merged.descriptionOverridden = patch.description !== tpl.description
          }
          changed = true
          return merged
        })
        if (!changed) return prev
        return { ...prev, [deptId]: next }
      })
    },
    [setTasksByDepartment],
  )

  const resetSystemDescription = useCallback(
    (deptId, taskId) => {
      setTasksByDepartment((prev) => {
        const existing = prev[deptId] ?? []
        let changed = false
        const next = existing.map((t) => {
          if (t.id !== taskId || !t.isSystem) return t
          const tpl = getTaskTemplate(t.sourceFieldKey, deptId)
          if (t.description === tpl.description && !t.descriptionOverridden) return t
          changed = true
          return { ...t, description: tpl.description, descriptionOverridden: false }
        })
        if (!changed) return prev
        return { ...prev, [deptId]: next }
      })
    },
    [setTasksByDepartment],
  )

  return {
    activeMap,
    setOwner,
    clearOwner,
    addUserTask,
    removeTask,
    updateTask,
    resetSystemDescription,
  }
}

/**
 * Returns deptId → list of task IDs owned by the given person. Used by the
 * collaborator-removal confirm flow in PropertiesPanel.
 */
export function getDepartmentsOwnedByPerson(ownerByDepartment, personId) {
  const out = []
  for (const [deptId, owner] of Object.entries(ownerByDepartment ?? {})) {
    if (owner?.id === personId) out.push(deptId)
  }
  return out
}

/**
 * Gate for a single department panel — domain approval action must be taken
 * and every human task must be acknowledged (accepted or deferred).
 */
export function getDepartmentApprovalGate({ deptId, tasks, approvalByDepartment }) {
  const approval = approvalByDepartment?.[deptId]
  if (!approval?.action) {
    return { canContinue: false, disabledReason: 'Approve or reject your domain slice to continue' }
  }
  const unacknowledged = (tasks ?? []).filter((t) => t.taskAction === 'pending').length
  if (unacknowledged > 0) {
    return {
      canContinue: false,
      disabledReason: `Acknowledge ${unacknowledged} task${unacknowledged === 1 ? '' : 's'} to continue`,
    }
  }
  return { canContinue: true, disabledReason: null }
}

/**
 * Aggregate gate across all active departments.
 * Returns how many depts are still missing an approval action or have
 * unacknowledged tasks — used for the sub-tracker footer caption.
 */
export function getDepartmentGateState({
  activeDeptIds,
  tasksByDepartment,
  approvalByDepartment,
}) {
  let missingApprovalCount = 0
  let unacknowledgedTaskCount = 0
  for (const deptId of activeDeptIds) {
    const approval = approvalByDepartment?.[deptId]
    if (!approval?.action) missingApprovalCount += 1
    const tasks = tasksByDepartment[deptId] ?? []
    for (const t of tasks) {
      if (t.taskAction === 'pending') unacknowledgedTaskCount += 1
    }
  }
  return {
    canContinue: missingApprovalCount === 0 && unacknowledgedTaskCount === 0,
    missingApprovalCount,
    unacknowledgedTaskCount,
  }
}
