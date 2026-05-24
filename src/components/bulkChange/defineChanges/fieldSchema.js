import {
  BadgeCheck,
  Briefcase,
  Building2,
  ClipboardList,
  Clock3,
  CreditCard,
  DollarSign,
  FileText,
  GraduationCap,
  Grid3X3,
  History,
  KeyRound,
  Laptop,
  ShieldCheck,
  Smartphone,
  Sliders,
  User,
  UserCog,
  Users,
} from 'lucide-react'

/**
 * Shared field schema used by both:
 *   • Single User profile page (EmployeeProfile.jsx)
 *   • Bulk Change → Define changes step
 *
 * Each field carries everything needed to render an editor for it: label,
 * key, type, options. Sections mirror the PROFILE_TABS layout. The
 * `derivationRuleKey` (optional) maps a field onto an entry in
 * derivationRules.js so the PropertiesSidebar auto-derives observers,
 * approvers, and process steps when the field is included in a bulk change.
 *
 * NOTE: values live elsewhere. Use `getCurrentValue(employee, fieldKey)`
 * in currentValues.js to resolve a per-employee value at render time.
 */

const f = (key, label, type = 'text', options) => ({ key, label, type, ...(options ? { options } : {}) })

export const FIELD_SECTIONS = [
  {
    id: 'role',
    label: 'Role information',
    icon: Briefcase,
    fields: [
      f('legalEntity', 'Legal entity'),
      f('title', 'Title'),
      f('department', 'Department', 'search-select'),
      f('departmentPath', 'Department path'),
      f('level', 'Level', 'select', ['P1', 'P2', 'P3', 'P4', 'P5']),
      f('teams', 'Teams', 'search-select'),
      f('jobFamily', 'Job Family', 'search-select'),
      f('duties', 'Duties', 'textarea'),
      f('workEmailAccess', 'Will get access to work email', 'select', ['Yes', 'No']),
      f('manager', 'Manager', 'search-select'),
      f('workLocation', 'Work location', 'search-select'),
      f('state', 'State', 'search-select'),
    ],
    derivationByField: {
      department: 'department',
      manager: 'manager',
      workLocation: 'workLocation',
      legalEntity: 'legalEntity',
    },
  },
  {
    id: 'personal',
    label: 'Personal information',
    icon: User,
    fields: [
      f('preferredFirstName', 'Preferred first name'),
      f('dateOfBirth', 'Date of birth', 'date'),
      f('legalGender', 'Legal gender', 'select', ['Female', 'Male', 'Non-binary', 'Prefer not to say']),
      f('preferredPronouns', 'Preferred pronouns', 'select', ['she/her', 'he/him', 'they/them', 'Prefer not to say']),
      f('maritalStatus', 'Marital status', 'select', ['Single', 'Married', 'Domestic Partnership', 'Prefer not to say']),
      f('nationalNumber', 'National number'),
      f('personalEmail', 'Personal email', 'email'),
      f('mobilePhone', 'Mobile phone', 'tel'),
      f('homeAddress', 'Home address', 'textarea'),
      f('emergencyContact', 'Emergency contact'),
      f('emergencyContactPhone', 'Emergency contact phone', 'tel'),
    ],
  },
  {
    id: 'additional',
    label: 'Additional information',
    icon: Sliders,
    fields: [
      f('countryOfCitizenship', 'Country of citizenship', 'search-select'),
      f('visaStatus', 'Visa status', 'select', ['N/A', 'Work Visa', 'H-1B', 'L-1', 'Other']),
      f('preferredLanguage', 'Preferred language', 'select', ['English', 'Spanish', 'French', 'German']),
      f('linkedin', 'LinkedIn profile'),
      f('github', 'GitHub profile'),
      f('shirtSize', 'T-shirt size', 'select', ['XS', 'S', 'M', 'L', 'XL']),
      f('dietary', 'Dietary restrictions'),
      f('notes', 'Notes', 'textarea'),
    ],
    derivationByField: { visaStatus: 'visaStatus' },
  },
  {
    id: 'reviewCycles',
    label: 'Review Cycles',
    icon: BadgeCheck,
    fields: [
      f('currentCycle', 'Current review cycle'),
      f('cadence', 'Review cadence', 'select', ['Quarterly', 'Semi-annual', 'Annual']),
      f('nextReview', 'Next review due', 'date'),
      f('managerReviewer', 'Manager reviewer', 'search-select'),
      f('selfReviewStatus', 'Self review status', 'select', ['Not started', 'In progress', 'Submitted']),
      f('peerReviewCount', 'Peer review count'),
      f('calibrationStatus', 'Calibration status', 'select', ['Not scheduled', 'Scheduled', 'Completed']),
      f('performanceTrend', 'Performance trend', 'select', ['Needs improvement', 'Meeting expectations', 'Exceeding expectations']),
    ],
  },
  {
    id: 'businessPartners',
    label: 'Business partners',
    icon: Users,
    fields: [
      f('hrbp', 'HR Business Partner', 'search-select'),
      f('recruiter', 'Recruiting Partner', 'search-select'),
      f('financePartner', 'Finance Partner', 'search-select'),
      f('itPartner', 'IT Partner', 'search-select'),
      f('legalPartner', 'Legal Partner', 'search-select'),
      f('payrollPartner', 'Payroll Specialist', 'search-select'),
      f('benefitsPartner', 'Benefits Specialist', 'search-select'),
      f('escalationChannel', 'Primary escalation channel'),
    ],
  },
  {
    id: 'jobs',
    label: 'Jobs',
    icon: UserCog,
    fields: [
      f('employmentType', 'Employment type', 'select', ['Full-time', 'Part-time', 'Contractor']),
      f('workerType', 'Worker type', 'select', ['Employee', 'Contingent worker', 'Intern']),
      f('jobCode', 'Job code'),
      f('fte', 'FTE', 'select', ['0.0', '0.5', '0.75', '1.0']),
      f('startDate', 'Start date', 'date'),
      f('jobsManager', 'Manager', 'search-select'),
      f('jobsWorkLocation', 'Work location', 'search-select'),
      f('timeZone', 'Time zone', 'select', ['Pacific Time', 'Mountain Time', 'Central Time', 'Eastern Time', 'GMT']),
    ],
    derivationByField: { employmentType: 'employmentType' },
  },
  {
    id: 'directReports',
    label: 'Direct reports',
    icon: Users,
    fields: [
      f('directReportCount', 'Direct report count'),
      f('directReports', 'Direct reports', 'textarea'),
      f('openReqs', 'Open requisitions'),
      f('headcountTarget', 'Team headcount target'),
      f('skipLevelCadence', 'Skip-level cadence', 'select', ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly']),
      f('officeHours', 'Manager office hours'),
      f('orgChartVisibility', 'Org chart visibility', 'select', ['Enabled', 'Disabled']),
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    fields: [
      f('offerLetter', 'Offer letter'),
      f('i9', 'I-9 verification', 'select', ['Pending', 'In review', 'Completed']),
      f('w4', 'W-4 form', 'select', ['Missing', 'On file', 'Expired']),
      f('directDepositAuth', 'Direct deposit authorization', 'select', ['Missing', 'On file']),
      f('handbookAck', 'Employee handbook acknowledgment', 'select', ['Not signed', 'Signed']),
      f('nda', 'Confidentiality agreement', 'select', ['Not signed', 'Signed']),
      f('recentUpload', 'Most recent upload', 'date'),
      f('retentionTag', 'Document retention tag', 'select', ['3 years', '5 years', '7 years', 'Permanent']),
    ],
  },
  {
    id: 'pay',
    label: 'My pay',
    icon: DollarSign,
    riskTier: 'high',
    fields: [
      f('baseCompensation', 'Base compensation', 'sensitive'),
      f('compPeriod', 'Compensation period', 'select', ['Hourly', 'Annual']),
      f('paySchedule', 'Payroll schedule', 'select', ['Weekly', 'Bi-weekly', 'Semi-monthly', 'Monthly']),
      f('payGroup', 'Pay group'),
      f('overtimeExemption', 'Overtime exemption', 'select', ['Exempt', 'Non-exempt']),
      f('bonusTarget', 'Bonus target', 'select', ['0%', '5%', '10%', '15%', '20%']),
      f('equityEligibility', 'Equity eligibility', 'select', ['Eligible', 'Not eligible']),
      f('bankAccount', 'Bank account ending', 'sensitive'),
      f('federalWithholding', 'Federal withholding'),
      f('stateWithholding', 'State withholding'),
    ],
    derivationRuleKey: 'compensation',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: CreditCard,
    fields: [
      f('expensePolicy', 'Expense policy', 'select', ['Standard Employee Policy', 'Manager Policy', 'Executive Policy']),
      f('approver', 'Approver', 'search-select'),
      f('corporateCard', 'Corporate card', 'select', ['Not issued', 'Issued', 'Suspended']),
      f('cardLimit', 'Card limit'),
      f('reimbursementMethod', 'Reimbursement method', 'select', ['Payroll', 'ACH transfer']),
      f('lastExpenseDate', 'Last submitted expense', 'date'),
      f('outstandingReimbursements', 'Outstanding reimbursements'),
      f('travelTier', 'Travel policy tier', 'select', ['Tier 1', 'Tier 2', 'Tier 3']),
    ],
  },
  {
    id: 'insurance',
    label: 'Insurance',
    icon: ShieldCheck,
    fields: [
      f('medicalPlan', 'Medical plan', 'select', ['Blue Shield PPO Gold', 'Blue Shield HMO', 'Kaiser HMO']),
      f('dentalPlan', 'Dental plan', 'select', ['Delta Dental Basic', 'Delta Dental Premium']),
      f('visionPlan', 'Vision plan', 'select', ['VSP Basic', 'VSP Choice']),
      f('retirement', '401(k) enrollment', 'select', ['Not enrolled', 'Enrolled - 3%', 'Enrolled - 6%', 'Enrolled - 10%']),
      f('hsaFsa', 'HSA/FSA', 'select', ['Not enrolled', 'HSA Enabled', 'FSA Enabled']),
      f('lifeInsurance', 'Life insurance'),
      f('dependentsCovered', 'Dependents covered'),
      f('coverageDate', 'Coverage effective date', 'date'),
    ],
  },
  {
    id: 'apps',
    label: 'Apps',
    icon: Grid3X3,
    fields: [
      f('gsuite', 'Google Workspace', 'select', ['Provisioned', 'Pending', 'Deprovisioned']),
      f('slack', 'Slack', 'select', ['Active', 'Invited', 'Deactivated']),
      f('jira', 'Jira', 'select', ['Active', 'Invited', 'Deactivated']),
      f('githubAccess', 'GitHub', 'select', ['Active', 'Invited', 'Deactivated']),
      f('notion', 'Notion', 'select', ['Active', 'Invited', 'Deactivated']),
      f('zoom', 'Zoom', 'select', ['Basic', 'Licensed', 'Not assigned']),
      f('lastSync', 'Last app sync', 'date'),
      f('accessProfile', 'Access profile'),
    ],
    derivationRuleKey: 'appAccess',
  },
  {
    id: 'devices',
    label: 'Devices',
    icon: Laptop,
    fields: [
      f('primaryDevice', 'Primary device'),
      f('serialNumber', 'Serial number', 'sensitive'),
      f('deviceStatus', 'Device status', 'select', ['Compliant', 'At risk', 'Out of compliance']),
      f('assignedDate', 'Assigned date', 'date'),
      f('mdmProfile', 'MDM profile'),
      f('diskEncryption', 'Disk encryption', 'select', ['Enabled', 'Disabled']),
      f('osVersion', 'OS version'),
      f('accessories', 'Accessories', 'textarea'),
    ],
    derivationRuleKey: 'devices',
  },
  {
    id: 'twoFactor',
    label: 'Two-factor devices',
    icon: Smartphone,
    fields: [
      f('primary2fa', 'Primary method', 'select', ['Okta Verify Push', 'SMS', 'Authenticator app', 'Security key']),
      f('backup2fa', 'Backup method', 'select', ['SMS', 'Authenticator app', 'Security key', 'None']),
      f('securityKeys', 'Security keys enrolled'),
      f('backupCodes', 'Backup codes generated', 'select', ['Yes', 'No']),
      f('last2faReset', 'Last 2FA reset', 'date'),
      f('recoveryEmail', 'Recovery email', 'email'),
      f('twoFaCompliance', '2FA compliance', 'select', ['Compliant', 'At risk']),
    ],
  },
  {
    id: 'authentication',
    label: 'Authentication',
    icon: KeyRound,
    fields: [
      f('ssoProvider', 'SSO provider', 'select', ['Okta', 'Google SSO', 'Microsoft Entra']),
      f('accountStatus', 'Account status', 'select', ['Active', 'Suspended', 'Locked']),
      f('passwordChanged', 'Password last changed', 'date'),
      f('sessionTimeout', 'Session timeout', 'select', ['4 hours', '8 hours', '12 hours', '24 hours']),
      f('mfaEnforcement', 'MFA enforcement', 'select', ['Required', 'Optional']),
      f('ipRestrictions', 'IP restrictions', 'select', ['None', 'Corporate only', 'Corporate + VPN']),
      f('lastSignin', 'Last successful sign-in'),
      f('failedSignins', 'Failed sign-in attempts (30d)'),
    ],
  },
  {
    id: 'compensation',
    label: 'Compensation information',
    icon: DollarSign,
    riskTier: 'high',
    fields: [
      f('compBand', 'Compensation band'),
      f('compaRatio', 'Compa-ratio'),
      f('currency', 'Currency', 'select', ['USD', 'EUR', 'GBP', 'CAD']),
      f('meritCycle', 'Merit cycle', 'select', ['Annual - April', 'Annual - October']),
      f('lastIncreaseDate', 'Last increase date', 'date'),
      f('lastIncreaseAmount', 'Last increase amount'),
      f('ttc', 'Total target cash', 'sensitive'),
      f('eligibilityStatus', 'Eligibility status', 'select', ['Eligible', 'Not eligible']),
    ],
    derivationRuleKey: 'compensation',
  },
  {
    id: 'learning',
    label: 'Learning management',
    icon: GraduationCap,
    fields: [
      f('requiredTrainings', 'Required trainings'),
      f('completedTrainings', 'Completed trainings'),
      f('completionRate', 'Completion rate'),
      f('overdueTrainings', 'Overdue trainings'),
      f('lastCourse', 'Last completed course'),
      f('learningPath', 'Learning path'),
      f('certificationStatus', 'Certification status', 'select', ['Not started', 'In progress', 'Completed']),
      f('nextDueDate', 'Next due training date', 'date'),
    ],
  },
  {
    id: 'pastEmployment',
    label: 'Past employment',
    icon: History,
    fields: [
      f('prevEmployer', 'Previous employer'),
      f('prevTitle', 'Previous title'),
      f('priorExperience', 'Prior years of experience'),
      f('recentEndDate', 'Most recent end date', 'date'),
      f('reasonLeaving', 'Reason for leaving'),
      f('rehireEligible', 'Rehire eligible', 'select', ['Yes', 'No']),
      f('backgroundCheck', 'Background check status', 'select', ['Pending', 'Cleared', 'Action needed']),
      f('referenceCheck', 'Reference check status', 'select', ['Pending', 'Completed']),
    ],
  },
  {
    id: 'customFields',
    label: 'Custom fields',
    icon: ClipboardList,
    fields: [
      f('costCenter', 'Cost center'),
      f('businessUnit', 'Business unit'),
      f('division', 'Division'),
      f('region', 'Region', 'select', ['North America', 'EMEA', 'APAC', 'LATAM']),
      f('workerSegment', 'Worker segment', 'select', ['Corporate', 'Field', 'Executive']),
      f('unionStatus', 'Union status', 'select', ['Not represented', 'Represented']),
      f('worksCouncil', 'Works council', 'select', ['Not applicable', 'Required']),
      f('nickname', 'Internal nickname'),
    ],
  },
]

// Flat index: fieldKey → { ...field, sectionId, sectionLabel, sectionIcon, derivationRuleKey, riskTier }
export const FIELDS_BY_KEY = (() => {
  const map = new Map()
  for (const section of FIELD_SECTIONS) {
    const sectionRuleKey = section.derivationRuleKey ?? null
    for (const field of section.fields) {
      const fieldRuleKey = section.derivationByField?.[field.key] ?? sectionRuleKey
      map.set(field.key, {
        ...field,
        sectionId: section.id,
        sectionLabel: section.label,
        sectionIcon: section.icon,
        riskTier: section.riskTier ?? null,
        derivationRuleKey: fieldRuleKey,
      })
    }
  }
  return map
})()

export function getFieldMeta(fieldKey) {
  return FIELDS_BY_KEY.get(fieldKey) ?? null
}

export function getDerivationKeysForFields(fieldKeys) {
  const ruleKeys = new Set()
  for (const key of fieldKeys) {
    const meta = FIELDS_BY_KEY.get(key)
    if (meta?.derivationRuleKey) ruleKeys.add(meta.derivationRuleKey)
  }
  return [...ruleKeys]
}
