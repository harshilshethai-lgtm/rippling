import { FIELDS_BY_KEY } from '../../defineChanges/fieldSchema'

/**
 * System-recommended starter task per (fieldKey × departmentId).
 *
 * Exactly one task is auto-generated per pair; the user can add more manually
 * inside the same group. Title is locked (clearly marked system-recommended);
 * description is editable with Reset.
 *
 * If a (fieldKey, deptId) pair has no specific template, getTaskTemplate falls
 * back to GENERIC_TEMPLATES[deptId] which uses the human field label.
 */
const TEMPLATES = {
  // ── Work location / region (the canonical example, all 7 departments) ──
  workLocation: {
    hr: {
      title: 'Update employee records for new location',
      description:
        'Verify home address, work-eligibility documents, and any country-specific HR fields before the new location takes effect.',
    },
    payroll: {
      title: 'Run final payroll in old currency',
      description:
        'Close one final payroll cycle in the old currency before the effective date so the next cycle issues correctly in the new region.',
    },
    it: {
      title: 'Update access policy for new country',
      description:
        'Confirm IP allow-lists, regional VPN routes, and device routing are configured for the new country.',
    },
    finance: {
      title: 'Adjust equity and spend baseline',
      description:
        'Re-evaluate equity grants under the new country\u2019s tax treatment and rebaseline spend forecast in the new currency.',
    },
    global: {
      title: 'Confirm tax-system and entity readiness',
      description:
        'Verify our tax engine supports the new country and that the legal entity exists; engage a local EOR if not.',
    },
    benefits: {
      title: 'Move insurance enrolment to the new region',
      description:
        'End the current enrolment and re-enrol the employee in country-appropriate medical, dental, and retirement plans.',
    },
    compliance: {
      title: 'Assign country-specific training',
      description:
        'Assign and track completion of training required by the new country (e.g. data protection, anti-harassment).',
    },
  },

  // ── Currency change ────────────────────────────────────────────────────
  currency: {
    payroll: {
      title: 'Reconcile pending paychecks under new currency',
      description:
        'Hold pending drafts, recompute totals at the new FX rate, and re-issue in the new currency on the effective date.',
    },
    finance: {
      title: 'Re-baseline spend and accruals',
      description:
        'Translate existing accruals and forecasts into the new currency and notify FP&A of any baseline shifts.',
    },
  },

  // ── Employment type ────────────────────────────────────────────────────
  employmentType: {
    hr: {
      title: 'Re-issue employment paperwork',
      description:
        'Trigger the new offer letter or contractor agreement and update the employee record to reflect the new classification.',
    },
    payroll: {
      title: 'Switch pay engine for new employment type',
      description:
        'Move the employee onto the appropriate pay engine (W-2 vs 1099) and confirm the next cycle calculates correctly.',
    },
    benefits: {
      title: 'Re-evaluate plan eligibility (incl. COBRA)',
      description:
        'Determine the new eligibility window and trigger a COBRA offer if the change moves the employee out of plan coverage.',
    },
    compliance: {
      title: 'Reassign training catalog for new worker type',
      description:
        'Replace the required-training set, cancel obsolete assignments, and reset completion deadlines.',
    },
  },

  // ── Manager change ─────────────────────────────────────────────────────
  manager: {
    hr: {
      title: 'Notify outgoing and incoming manager',
      description:
        'Send the manager-change packet to both parties and confirm the 1:1 cadence pickup with the new manager.',
    },
  },
  jobsManager: {
    hr: {
      title: 'Notify outgoing and incoming manager',
      description:
        'Send the manager-change packet to both parties and confirm the 1:1 cadence pickup with the new manager.',
    },
  },

  // ── Legal entity ───────────────────────────────────────────────────────
  legalEntity: {
    hr: {
      title: 'Issue updated employment contract for new entity',
      description:
        'Generate the new contract under the receiving legal entity and route it for signature before the effective date.',
    },
    payroll: {
      title: 'Move employee to new entity\u2019s payroll',
      description:
        'Cut a final pay-run under the old entity, then onboard the employee onto the new entity\u2019s payroll.',
    },
    finance: {
      title: 'Re-allocate cost center and intercompany routing',
      description:
        'Update cost-center coding and intercompany recharges so spend lands against the new entity.',
    },
    global: {
      title: 'Confirm tax and registration status in new entity',
      description:
        'Verify the receiving entity is registered for payroll tax in the employee\u2019s country and that the engine is configured.',
    },
    benefits: {
      title: 'Map benefits to receiving entity plans',
      description:
        'End current enrolment and re-enrol the employee in the receiving entity\u2019s benefits plans.',
    },
    compliance: {
      title: 'Re-assign entity-specific compliance training',
      description:
        'Cancel obsolete training and assign training required by the receiving entity\u2019s jurisdiction.',
    },
  },

  // ── Compensation (base / band / TTC) ───────────────────────────────────
  baseCompensation: {
    payroll: {
      title: 'Push new base comp to payroll engine',
      description:
        'Update the payroll record with the new base, confirm proration for the partial cycle, and verify the next paycheck.',
    },
    finance: {
      title: 'Reforecast salary cost and update equity refresh',
      description:
        'Refresh the salary cost forecast and confirm whether the change triggers an equity refresh per the policy.',
    },
  },

  // ── Visa / citizenship ─────────────────────────────────────────────────
  visaStatus: {
    hr: {
      title: 'Update right-to-work record and expiry tracking',
      description:
        'Refresh the right-to-work record and set a renewal reminder ahead of the visa expiry.',
    },
    global: {
      title: 'Confirm visa permits work in current location',
      description:
        'Verify the new visa permits employment in the country of work and engage immigration counsel if not.',
    },
    compliance: {
      title: 'Re-run sanctions and background screening as required',
      description:
        'Run any additional background or sanctions screening required by the visa class.',
    },
  },

  // ── Insurance / benefits ───────────────────────────────────────────────
  medicalPlan: {
    benefits: {
      title: 'Confirm new plan eligibility and enrolment date',
      description:
        'Verify the new plan is open for enrolment on the effective date and that dependent coverage transfers cleanly.',
    },
  },

  // ── App access ─────────────────────────────────────────────────────────
  apps: {
    it: {
      title: 'Reconcile app provisioning against the new access profile',
      description:
        'Reconcile current group memberships against the new access profile and revoke any that no longer apply.',
    },
  },

  // ── Required training ──────────────────────────────────────────────────
  requiredTrainings: {
    compliance: {
      title: 'Assign required training and track completion',
      description:
        'Assign the updated training set and monitor completion rates ahead of the regulatory deadline.',
    },
  },
}

/**
 * Per-department fallback template — used when (fieldKey × deptId) is not in
 * TEMPLATES above. Renders a sensible, role-appropriate title using the field
 * label so users always see something useful in the prototype.
 */
const GENERIC_TEMPLATES = {
  hr: (fieldLabel) => ({
    title: `Review HR record impact of "${fieldLabel}" change`,
    description: `Confirm that updating "${fieldLabel}" does not invalidate any HR records, partner assignments, or required documentation.`,
  }),
  payroll: (fieldLabel) => ({
    title: `Verify payroll impact of "${fieldLabel}" change`,
    description: `Check whether the change to "${fieldLabel}" affects the next pay cycle and reconcile any downstream pay records.`,
  }),
  it: (fieldLabel) => ({
    title: `Reconcile IT access against "${fieldLabel}" change`,
    description: `Review identity, device, and app access policies that depend on "${fieldLabel}" and adjust as needed.`,
  }),
  finance: (fieldLabel) => ({
    title: `Adjust finance baseline for "${fieldLabel}" change`,
    description: `Update spend, equity, or accrual baselines impacted by the change to "${fieldLabel}".`,
  }),
  global: (fieldLabel) => ({
    title: `Confirm global readiness for "${fieldLabel}" change`,
    description: `Verify tax engine, legal entity, and country support remain valid after the change to "${fieldLabel}".`,
  }),
  benefits: (fieldLabel) => ({
    title: `Re-evaluate benefits eligibility for "${fieldLabel}" change`,
    description: `Check medical, retirement, and carrier coverage for any eligibility shifts caused by the change to "${fieldLabel}".`,
  }),
  compliance: (fieldLabel) => ({
    title: `Re-run compliance checks for "${fieldLabel}" change`,
    description: `Re-assign or re-evaluate training and regulatory checks impacted by the change to "${fieldLabel}".`,
  }),
}

/**
 * Resolve the system-recommended task template for a (fieldKey × deptId)
 * pair. Falls back to the per-department generic template using the field's
 * human-readable label.
 */
export function getTaskTemplate(fieldKey, deptId) {
  const specific = TEMPLATES[fieldKey]?.[deptId]
  if (specific) {
    return { title: specific.title, description: specific.description }
  }
  const fieldMeta = FIELDS_BY_KEY.get(fieldKey)
  const fieldLabel = fieldMeta?.label ?? fieldKey
  const generic = GENERIC_TEMPLATES[deptId]
  if (generic) return generic(fieldLabel)
  return {
    title: `Review impact of "${fieldLabel}" change`,
    description: `Coordinate any follow-up work in your area arising from the change to "${fieldLabel}".`,
  }
}

/**
 * Build the stable id used for the auto-generated system task tied to a
 * (fieldKey, deptId) pair. Used both for initial seeding and re-sync.
 */
export function systemTaskId(deptId, fieldKey) {
  return `sys.${deptId}.${fieldKey}`
}
