import {
  Briefcase,
  Building2,
  DoorClosed,
  DollarSign,
  GitBranch,
  Globe,
  KeyRound,
  PlaneTakeoff,
  ShieldCheck,
  TrendingUp,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import { FIELDS_BY_KEY } from './fieldSchema'

/**
 * Static playbook catalogue used by the Define Changes composer.
 *
 * Each playbook is a curated bundle of field keys for a common bulk-change
 * scenario plus, optionally, default uniform values that almost always hold
 * (e.g. an Onboard cohort is virtually always Full-time). Defaults are *not*
 * set for fields that are the whole point of the change (Relocation does not
 * pre-set workLocation — that's the variable the user is here to fill in).
 *
 * Field keys are validated against fieldSchema.FIELDS_BY_KEY at module load:
 * an unknown key throws so the catalogue can't silently rot when the schema
 * evolves.
 */

const playbook = (id, label, icon, description, fieldKeys, defaults = {}) => ({
  id,
  label,
  icon,
  description,
  fieldKeys,
  defaults,
})

export const TEMPLATES = [
  playbook(
    'reorg',
    'Run a reorg',
    GitBranch,
    'Rewire managers, teams, and departments across a population.',
    ['manager', 'department', 'departmentPath', 'teams', 'level', 'region'],
  ),
  playbook(
    'relocate',
    'Relocate people',
    PlaneTakeoff,
    'Move employees between offices, states, or countries — taxes, time zone, work location.',
    ['workLocation', 'state', 'timeZone', 'stateWithholding', 'costCenter'],
  ),
  playbook(
    'office-close',
    'Close an office',
    DoorClosed,
    'Wind down an office — relocate, terminate, or transition the people based there.',
    ['workLocation', 'employmentType', 'accountStatus', 'startDate', 'payGroup'],
  ),
  playbook(
    'promotion',
    'Promotion cycle',
    TrendingUp,
    'Apply title, level, and comp changes for promoted employees.',
    ['title', 'level', 'baseCompensation', 'bonusTarget', 'overtimeExemption', 'equityEligibility'],
  ),
  playbook(
    'merit',
    'Comp / Merit cycle',
    DollarSign,
    'Annual raises, bonus target updates, and per-person increase amounts.',
    ['baseCompensation', 'compPeriod', 'bonusTarget', 'lastIncreaseDate', 'lastIncreaseAmount'],
  ),
  playbook(
    'onboard',
    'Onboard cohort',
    UserPlus,
    'Stand up a class of new hires with consistent role, location, and access setup.',
    [
      'startDate',
      'employmentType',
      'manager',
      'workLocation',
      'jobCode',
      'workEmailAccess',
      'primaryDevice',
      'requiredTrainings',
    ],
    { employmentType: 'Full-time', workEmailAccess: 'Yes' },
  ),
  playbook(
    'offboard',
    'Offboard / RIF',
    UserMinus,
    'Terminate a population with consistent end-of-employment fields and IT lockdown.',
    ['accountStatus', 'recentEndDate', 'retentionTag', 'deviceStatus', 'reasonLeaving', 'rehireEligible'],
    { accountStatus: 'Suspended', deviceStatus: 'Out of compliance', rehireEligible: 'Yes' },
  ),
  playbook(
    'enrollment',
    'Open enrollment',
    ShieldCheck,
    'Annual benefits update — plan migrations, dependents, coverage dates.',
    ['medicalPlan', 'dentalPlan', 'visionPlan', 'retirement', 'hsaFsa', 'dependentsCovered', 'coverageDate'],
  ),
  playbook(
    'policy',
    'Policy / access rollout',
    KeyRound,
    'Roll out a new policy or access posture across teams — expense, card limits, SSO, MFA.',
    ['expensePolicy', 'cardLimit', 'accessProfile', 'ssoProvider', 'mfaEnforcement'],
  ),
  playbook(
    'acquisition',
    'Acquisition / transition',
    Building2,
    'Bring acquired employees into a new entity with mapped levels, comp, and start dates.',
    ['legalEntity', 'jobCode', 'level', 'baseCompensation', 'currency', 'startDate', 'manager', 'workLocation'],
  ),
]

// Fast lookup by id
export const TEMPLATES_BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]))

// Validate at module load — better to fail loudly than silently swallow a typo.
for (const template of TEMPLATES) {
  for (const key of template.fieldKeys) {
    if (!FIELDS_BY_KEY.has(key)) {
      throw new Error(
        `Template "${template.id}" references unknown field key "${key}". ` +
          'Update fieldSchema.js or fix the template.',
      )
    }
  }
  for (const key of Object.keys(template.defaults)) {
    if (!template.fieldKeys.includes(key)) {
      throw new Error(
        `Template "${template.id}" provides a default for "${key}" which is not in fieldKeys.`,
      )
    }
  }
}

export function getTemplate(id) {
  return TEMPLATES_BY_ID.get(id) ?? null
}

// Default icon used by suggestion previews when we know fields but not a template
export { Briefcase as GenericTemplateIcon, Globe as GenericScenarioIcon }
