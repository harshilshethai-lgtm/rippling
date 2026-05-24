import { useEffect, useMemo, useState } from 'react'
import {
  CircleHelp,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Info,
  MoreHorizontal,
  Network,
  Pencil,
  X,
} from 'lucide-react'
import { EMPLOYEES } from '../data/employees'
import { avatarClass, classNames, initials } from '../lib/utils'
import FieldInput from './shared/FieldInput'

const PROFILE_TABS = [
  'Role information',
  'Personal information',
  'Additional information',
  'Review Cycles',
  'Business partners',
  'Jobs',
  'Direct reports',
  'Documents',
  'My pay',
  'Expenses',
  'Insurance',
  'Apps',
  'Devices',
  'Two-factor devices',
  'Authentication',
  'Compensation information',
  'Learning management',
  'Past employment',
  'Custom fields',
]

const MASKED_VALUE = '••••••••••'

const STATUS_STYLES = {
  Active: 'bg-green-50 text-green-700 border-green-200',
  'On Leave': 'bg-amber-50 text-amber-700 border-amber-200',
  Onboarding: 'bg-blue-50 text-blue-700 border-blue-200',
}

const CHANGE_ACTORS = [
  { name: 'Jordan Lee', role: 'Rippling HRIS' },
  { name: 'Maya Patel', role: 'People Ops' },
  { name: 'Noah Thompson', role: 'Payroll Admin' },
  { name: 'Celeste Stephens', role: 'HR Business Partner' },
  { name: 'Diego Reyes', role: 'IT Provisioning' },
]

function formatDate(date) {
  if (!date) return '-'
  const parts = date.split('-')
  if (parts.length !== 3) return date
  return `${parts[1]}/${parts[2]}/${parts[0]}`
}

function displayLocation(location) {
  if (!location) return '-'
  if (location.startsWith('Remote')) return 'Remote'
  return location
}

function employmentLabel(type) {
  if (!type) return '-'
  if (type === 'Contractor') return 'Contractor'
  return `Salaried, ${type.toLowerCase()}`
}

function managerDisplay(manager) {
  if (!manager || manager === 'Board of Directors') return 'Unassigned'
  return manager
}

function deriveProfileValues(employee) {
  const idx = Number(employee.id.replace('emp-', '')) || 1
  const baseComp = 110000 + (idx % 14) * 5000
  const profileDepartment = employee.department === 'People' ? 'People Operations' : employee.department

  return {
    nationalNumber: '4086216710',
    dateOfBirth: '01/01/1990',
    fullHomeAddress: '1300 Torre Bella Avenue, Mountain View, CA 94043',
    personalEmail: `${employee.firstName.toLowerCase()}.${employee.lastName.toLowerCase()}@gmail.com`,
    preferredFirstName: employee.firstName,
    overtimeExemption: employee.employmentType === 'Contractor' ? 'Non-exempt' : 'Exempt',
    tshirtSize: ['S', 'M', 'L'][idx % 3],
    legalGender: idx % 3 === 0 ? 'Female' : idx % 3 === 1 ? 'Male' : 'Non-binary',
    baseCompensation: `$${baseComp.toLocaleString()}`,
    compensationTimePeriod: employee.employmentType === 'Contractor' ? 'Hourly' : 'Annual',
    ssn: `${100 + (idx % 800)}-${10 + (idx % 80)}-${1000 + idx}`,
    isCurrentlyOnLeave: employee.status === 'On Leave' ? 'True' : 'False',
    lastDayOfWork: '-',
    isManager: /Manager|Director|VP|Lead|Head|Chief|Counsel|COO|CFO|CHRO/.test(employee.title)
      ? 'True'
      : 'False',
    departmentDisplay: profileDepartment,
    departmentPath: `G&A > ${profileDepartment}`,
    mobilePhone: `+1 (415) 555-${String(1300 + idx).slice(-4)}`,
    workPhone: `+1 (650) 555-${String(2200 + idx).slice(-4)}`,
    preferredPronouns: idx % 3 === 0 ? 'she/her' : idx % 3 === 1 ? 'he/him' : 'they/them',
    maritalStatus: ['Single', 'Married', 'Domestic Partnership'][idx % 3],
    emergencyContact: 'Jamie Wilson',
    emergencyContactPhone: '+1 (415) 555-0198',
    countryOfCitizenship: 'United States',
    visaStatus: employee.location.includes('US') || employee.location === 'Remote (US)' ? 'N/A' : 'Work Visa',
    linkedIn: `linkedin.com/in/${employee.firstName.toLowerCase()}-${employee.lastName.toLowerCase()}`,
    github: `github.com/${employee.firstName.toLowerCase()}${employee.lastName.toLowerCase()}`,
    preferredLanguage: 'English',
    jobCode: `JOB-${String(4000 + idx)}`,
    fte: employee.employmentType === 'Part-time' ? '0.5' : employee.employmentType === 'Contractor' ? '0.0' : '1.0',
  }
}

function field(label, key, value, type = 'text', options) {
  return { label, key, value, type, options }
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function normalizeFieldValue(value) {
  if (value === undefined || value === null || value === '') return '-'
  return String(value)
}

function actorAt(index) {
  return CHANGE_ACTORS[index % CHANGE_ACTORS.length]
}

function actorForRole(role, fallbackIndex = 0) {
  return CHANGE_ACTORS.find((actor) => actor.role === role) || actorAt(fallbackIndex)
}

function buildInitialChangelog(employee, details) {
  const profileIndex = employee.profileNumber || 1
  const startDate = new Date(`${employee.startDate || '2025-01-01'}T16:00:00Z`)
  const actor = actorAt(profileIndex)
  const managerActor = actorAt(profileIndex + 1)
  const hrisActor = actorForRole('Rippling HRIS', profileIndex + 2)
  const payrollActor = actorForRole('Payroll Admin', profileIndex + 3)
  const peopleOpsActor = actorForRole('People Ops', profileIndex + 4)

  const entries = [
    {
      id: `${employee.id}-created`,
      section: 'Profile',
      fieldLabel: 'Employee profile',
      oldValue: '-',
      newValue: 'Created employee record',
      actorName: hrisActor.name,
      actorRole: hrisActor.role,
      changedAt: startDate.toISOString(),
    },
    {
      id: `${employee.id}-title`,
      section: 'Role information',
      fieldLabel: 'Title',
      oldValue: 'Candidate',
      newValue: employee.title,
      actorName: actor.name,
      actorRole: actor.role,
      changedAt: new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * 4).toISOString(),
    },
    {
      id: `${employee.id}-department`,
      section: 'Role information',
      fieldLabel: 'Department',
      oldValue: 'Unassigned',
      newValue: details.departmentDisplay,
      actorName: actor.name,
      actorRole: actor.role,
      changedAt: new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * 9).toISOString(),
    },
    {
      id: `${employee.id}-manager`,
      section: 'Jobs',
      fieldLabel: 'Manager',
      oldValue: 'Unassigned',
      newValue: managerDisplay(employee.manager),
      actorName: managerActor.name,
      actorRole: managerActor.role,
      changedAt: new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    },
    {
      id: `${employee.id}-comp`,
      section: 'My pay',
      fieldLabel: 'Base compensation',
      oldValue: '$0',
      newValue: details.baseCompensation,
      actorName: payrollActor.name,
      actorRole: payrollActor.role,
      changedAt: new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * 21).toISOString(),
    },
  ]

  if (employee.status !== 'Active') {
    entries.unshift({
      id: `${employee.id}-status`,
      section: 'Role information',
      fieldLabel: 'Status',
      oldValue: 'Active',
      newValue: employee.status,
      actorName: peopleOpsActor.name,
      actorRole: peopleOpsActor.role,
      changedAt: new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * 31).toISOString(),
    })
  }

  return entries.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
}

function buildFieldChangeLogEntries(previousFields, nextFields, tab) {
  const previousByKey = new Map((previousFields[tab] || []).map((item) => [item.key, item]))
  const timestamp = new Date().toISOString()

  return (nextFields[tab] || [])
    .filter((item) => {
      const previousItem = previousByKey.get(item.key)
      if (!previousItem) return false
      return normalizeFieldValue(previousItem.value) !== normalizeFieldValue(item.value)
    })
    .map((item) => {
      const previousItem = previousByKey.get(item.key)
      return {
        id: `${tab}-${item.key}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        section: tab,
        fieldLabel: item.label,
        oldValue: normalizeFieldValue(previousItem?.value),
        newValue: normalizeFieldValue(item.value),
        actorName: 'Harshil Sheth',
        actorRole: 'People Admin',
        changedAt: timestamp,
      }
    })
}

function buildTabFields(employee, details) {
  const directReports = EMPLOYEES.filter((emp) => emp.managerId === employee.id)
  const directReportNames = directReports.slice(0, 8).map((emp) => emp.fullName).join(', ') || '-'

  return {
    'Role information': [
      field('Legal entity', 'legalEntity', 'Acme, Inc.'),
      field('Title', 'title', employee.title),
      field('Department', 'department', details.departmentDisplay, 'search-select'),
      field('Department path', 'departmentPath', details.departmentPath),
      field('Level', 'level', 'P3', 'select', ['P1', 'P2', 'P3', 'P4', 'P5']),
      field('Teams', 'teams', 'People Operations', 'search-select'),
      field('Job Family', 'jobFamily', 'Administrative Support', 'search-select'),
      field('Duties', 'duties', 'Own employee lifecycle operations and workforce records.', 'textarea'),
      field('Will get access to work email', 'workEmailAccess', 'Yes', 'select', ['Yes', 'No']),
      field('Manager', 'manager', managerDisplay(employee.manager), 'search-select'),
      field('Work location', 'workLocation', displayLocation(employee.location), 'search-select'),
      field('State', 'state', 'California', 'search-select'),
    ],
    'Personal information': [
      field('Preferred first name', 'preferredFirstName', details.preferredFirstName),
      field('Date of birth', 'dateOfBirth', details.dateOfBirth, 'date'),
      field('Legal gender', 'legalGender', details.legalGender, 'select', ['Female', 'Male', 'Non-binary', 'Prefer not to say']),
      field('Preferred pronouns', 'preferredPronouns', details.preferredPronouns, 'select', ['she/her', 'he/him', 'they/them', 'Prefer not to say']),
      field('Marital status', 'maritalStatus', details.maritalStatus, 'select', ['Single', 'Married', 'Domestic Partnership', 'Prefer not to say']),
      field('National number', 'nationalNumber', details.nationalNumber),
      field('Personal email', 'personalEmail', details.personalEmail, 'email'),
      field('Mobile phone', 'mobilePhone', details.mobilePhone, 'tel'),
      field('Home address', 'homeAddress', details.fullHomeAddress, 'textarea'),
      field('Emergency contact', 'emergencyContact', details.emergencyContact),
      field('Emergency contact phone', 'emergencyContactPhone', details.emergencyContactPhone, 'tel'),
    ],
    'Additional information': [
      field('Country of citizenship', 'countryOfCitizenship', details.countryOfCitizenship, 'search-select'),
      field('Visa status', 'visaStatus', details.visaStatus, 'select', ['N/A', 'Work Visa', 'H-1B', 'L-1', 'Other']),
      field('Preferred language', 'preferredLanguage', details.preferredLanguage, 'select', ['English', 'Spanish', 'French', 'German']),
      field('LinkedIn profile', 'linkedin', details.linkedIn),
      field('GitHub profile', 'github', details.github),
      field('T-shirt size', 'shirtSize', details.tshirtSize, 'select', ['XS', 'S', 'M', 'L', 'XL']),
      field('Dietary restrictions', 'dietary', 'None'),
      field('Notes', 'notes', 'Remote-first worker. Attends monthly team offsite.', 'textarea'),
    ],
    'Review Cycles': [
      field('Current review cycle', 'currentCycle', 'FY26 Q2'),
      field('Review cadence', 'cadence', 'Semi-annual', 'select', ['Quarterly', 'Semi-annual', 'Annual']),
      field('Next review due', 'nextReview', '2026-08-15', 'date'),
      field('Manager reviewer', 'managerReviewer', managerDisplay(employee.manager), 'search-select'),
      field('Self review status', 'selfReviewStatus', 'In progress', 'select', ['Not started', 'In progress', 'Submitted']),
      field('Peer review count', 'peerReviewCount', '3'),
      field('Calibration status', 'calibrationStatus', 'Scheduled', 'select', ['Not scheduled', 'Scheduled', 'Completed']),
      field('Performance trend', 'performanceTrend', 'Exceeding expectations', 'select', ['Needs improvement', 'Meeting expectations', 'Exceeding expectations']),
    ],
    'Business partners': [
      field('HR Business Partner', 'hrbp', 'Celeste Stephens', 'search-select'),
      field('Recruiting Partner', 'recruiter', 'Maya Patel', 'search-select'),
      field('Finance Partner', 'financePartner', 'Rachel Kim', 'search-select'),
      field('IT Partner', 'itPartner', 'Diego Reyes', 'search-select'),
      field('Legal Partner', 'legalPartner', 'Aditi Brown', 'search-select'),
      field('Payroll Specialist', 'payrollPartner', 'Noah Thompson', 'search-select'),
      field('Benefits Specialist', 'benefitsPartner', 'Olivia Chen', 'search-select'),
      field('Primary escalation channel', 'escalationChannel', '#people-ops-escalations'),
    ],
    Jobs: [
      field('Employment type', 'employmentType', employee.employmentType, 'select', ['Full-time', 'Part-time', 'Contractor']),
      field('Worker type', 'workerType', employee.employmentType === 'Contractor' ? 'Contingent worker' : 'Employee', 'select', ['Employee', 'Contingent worker', 'Intern']),
      field('Job code', 'jobCode', details.jobCode),
      field('FTE', 'fte', details.fte, 'select', ['0.0', '0.5', '0.75', '1.0']),
      field('Start date', 'startDate', employee.startDate, 'date'),
      field('Manager', 'manager', managerDisplay(employee.manager), 'search-select'),
      field('Work location', 'workLocation', displayLocation(employee.location), 'search-select'),
      field('Time zone', 'timeZone', 'Pacific Time', 'select', ['Pacific Time', 'Mountain Time', 'Central Time', 'Eastern Time', 'GMT']),
    ],
    'Direct reports': [
      field('Direct report count', 'directReportCount', String(directReports.length)),
      field('Direct reports', 'directReports', directReportNames, 'textarea'),
      field('Open requisitions', 'openReqs', '2'),
      field('Team headcount target', 'headcountTarget', String(Math.max(3, directReports.length + 2))),
      field('Skip-level cadence', 'skipLevelCadence', 'Monthly', 'select', ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly']),
      field('Manager office hours', 'officeHours', 'Fridays, 2:00 PM PT'),
      field('Org chart visibility', 'orgChartVisibility', 'Enabled', 'select', ['Enabled', 'Disabled']),
    ],
    Documents: [
      field('Offer letter', 'offerLetter', 'Signed'),
      field('I-9 verification', 'i9', 'Completed', 'select', ['Pending', 'In review', 'Completed']),
      field('W-4 form', 'w4', 'On file', 'select', ['Missing', 'On file', 'Expired']),
      field('Direct deposit authorization', 'directDepositAuth', 'On file', 'select', ['Missing', 'On file']),
      field('Employee handbook acknowledgment', 'handbookAck', 'Signed', 'select', ['Not signed', 'Signed']),
      field('Confidentiality agreement', 'nda', 'Signed', 'select', ['Not signed', 'Signed']),
      field('Most recent upload', 'recentUpload', '2026-04-18', 'date'),
      field('Document retention tag', 'retentionTag', '7 years', 'select', ['3 years', '5 years', '7 years', 'Permanent']),
    ],
    'My pay': [
      field('Base compensation', 'baseCompensation', details.baseCompensation, 'sensitive'),
      field('Compensation period', 'compPeriod', details.compensationTimePeriod, 'select', ['Hourly', 'Annual']),
      field('Payroll schedule', 'paySchedule', 'Bi-weekly', 'select', ['Weekly', 'Bi-weekly', 'Semi-monthly', 'Monthly']),
      field('Pay group', 'payGroup', 'US Salaried'),
      field('Overtime exemption', 'overtimeExemption', details.overtimeExemption, 'select', ['Exempt', 'Non-exempt']),
      field('Bonus target', 'bonusTarget', '10%', 'select', ['0%', '5%', '10%', '15%', '20%']),
      field('Equity eligibility', 'equityEligibility', 'Eligible', 'select', ['Eligible', 'Not eligible']),
      field('Bank account ending', 'bankAccount', '4321', 'sensitive'),
      field('Federal withholding', 'federalWithholding', 'Single, 1 allowance'),
      field('State withholding', 'stateWithholding', 'California standard'),
    ],
    Expenses: [
      field('Expense policy', 'expensePolicy', 'Standard Employee Policy', 'select', ['Standard Employee Policy', 'Manager Policy', 'Executive Policy']),
      field('Approver', 'approver', managerDisplay(employee.manager), 'search-select'),
      field('Corporate card', 'corporateCard', 'Issued', 'select', ['Not issued', 'Issued', 'Suspended']),
      field('Card limit', 'cardLimit', '$5,000 / month'),
      field('Reimbursement method', 'reimbursementMethod', 'Payroll', 'select', ['Payroll', 'ACH transfer']),
      field('Last submitted expense', 'lastExpenseDate', '2026-05-03', 'date'),
      field('Outstanding reimbursements', 'outstandingReimbursements', '$242.10'),
      field('Travel policy tier', 'travelTier', 'Tier 2', 'select', ['Tier 1', 'Tier 2', 'Tier 3']),
    ],
    Insurance: [
      field('Medical plan', 'medicalPlan', 'Blue Shield PPO Gold', 'select', ['Blue Shield PPO Gold', 'Blue Shield HMO', 'Kaiser HMO']),
      field('Dental plan', 'dentalPlan', 'Delta Dental Premium', 'select', ['Delta Dental Basic', 'Delta Dental Premium']),
      field('Vision plan', 'visionPlan', 'VSP Choice', 'select', ['VSP Basic', 'VSP Choice']),
      field('401(k) enrollment', 'retirement', 'Enrolled - 6%', 'select', ['Not enrolled', 'Enrolled - 3%', 'Enrolled - 6%', 'Enrolled - 10%']),
      field('HSA/FSA', 'hsaFsa', 'HSA Enabled', 'select', ['Not enrolled', 'HSA Enabled', 'FSA Enabled']),
      field('Life insurance', 'lifeInsurance', '2x base salary'),
      field('Dependents covered', 'dependentsCovered', '2'),
      field('Coverage effective date', 'coverageDate', '2025-09-01', 'date'),
    ],
    Apps: [
      field('Google Workspace', 'gsuite', 'Provisioned', 'select', ['Provisioned', 'Pending', 'Deprovisioned']),
      field('Slack', 'slack', 'Active', 'select', ['Active', 'Invited', 'Deactivated']),
      field('Jira', 'jira', 'Active', 'select', ['Active', 'Invited', 'Deactivated']),
      field('GitHub', 'githubAccess', 'Active', 'select', ['Active', 'Invited', 'Deactivated']),
      field('Notion', 'notion', 'Active', 'select', ['Active', 'Invited', 'Deactivated']),
      field('Zoom', 'zoom', 'Licensed', 'select', ['Basic', 'Licensed', 'Not assigned']),
      field('Last app sync', 'lastSync', '2026-05-18', 'date'),
      field('Access profile', 'accessProfile', 'People Ops - Manager'),
    ],
    Devices: [
      field('Primary device', 'primaryDevice', 'MacBook Pro 14" (M3)'),
      field('Serial number', 'serialNumber', 'C02YX8ABMD6R', 'sensitive'),
      field('Device status', 'deviceStatus', 'Compliant', 'select', ['Compliant', 'At risk', 'Out of compliance']),
      field('Assigned date', 'assignedDate', '2025-09-03', 'date'),
      field('MDM profile', 'mdmProfile', 'Rippling MDM - Standard'),
      field('Disk encryption', 'diskEncryption', 'Enabled', 'select', ['Enabled', 'Disabled']),
      field('OS version', 'osVersion', 'macOS 14.7'),
      field('Accessories', 'accessories', 'Dock, Monitor, Keyboard, Mouse', 'textarea'),
    ],
    'Two-factor devices': [
      field('Primary method', 'primary2fa', 'Okta Verify Push', 'select', ['Okta Verify Push', 'SMS', 'Authenticator app', 'Security key']),
      field('Backup method', 'backup2fa', 'SMS', 'select', ['SMS', 'Authenticator app', 'Security key', 'None']),
      field('Security keys enrolled', 'securityKeys', '1'),
      field('Backup codes generated', 'backupCodes', 'Yes', 'select', ['Yes', 'No']),
      field('Last 2FA reset', 'last2faReset', '2026-03-11', 'date'),
      field('Recovery email', 'recoveryEmail', employee.email, 'email'),
      field('2FA compliance', 'twoFaCompliance', 'Compliant', 'select', ['Compliant', 'At risk']),
    ],
    Authentication: [
      field('SSO provider', 'ssoProvider', 'Okta', 'select', ['Okta', 'Google SSO', 'Microsoft Entra']),
      field('Account status', 'accountStatus', 'Active', 'select', ['Active', 'Suspended', 'Locked']),
      field('Password last changed', 'passwordChanged', '2026-04-09', 'date'),
      field('Session timeout', 'sessionTimeout', '12 hours', 'select', ['4 hours', '8 hours', '12 hours', '24 hours']),
      field('MFA enforcement', 'mfaEnforcement', 'Required', 'select', ['Required', 'Optional']),
      field('IP restrictions', 'ipRestrictions', 'Corporate + VPN', 'select', ['None', 'Corporate only', 'Corporate + VPN']),
      field('Last successful sign-in', 'lastSignin', '2026-05-19'),
      field('Failed sign-in attempts (30d)', 'failedSignins', '1'),
    ],
    'Compensation information': [
      field('Compensation band', 'compBand', 'P3 - Midpoint $132,000'),
      field('Compa-ratio', 'compaRatio', '0.96'),
      field('Currency', 'currency', 'USD', 'select', ['USD', 'EUR', 'GBP', 'CAD']),
      field('Merit cycle', 'meritCycle', 'Annual - April', 'select', ['Annual - April', 'Annual - October']),
      field('Last increase date', 'lastIncreaseDate', '2026-04-01', 'date'),
      field('Last increase amount', 'lastIncreaseAmount', '$7,500'),
      field('Total target cash', 'ttc', '$145,000', 'sensitive'),
      field('Eligibility status', 'eligibilityStatus', 'Eligible', 'select', ['Eligible', 'Not eligible']),
    ],
    'Learning management': [
      field('Required trainings', 'requiredTrainings', '7'),
      field('Completed trainings', 'completedTrainings', '6'),
      field('Completion rate', 'completionRate', '86%'),
      field('Overdue trainings', 'overdueTrainings', '1'),
      field('Last completed course', 'lastCourse', 'Preventing Workplace Harassment'),
      field('Learning path', 'learningPath', 'People Manager Onboarding'),
      field('Certification status', 'certificationStatus', 'In progress', 'select', ['Not started', 'In progress', 'Completed']),
      field('Next due training date', 'nextDueDate', '2026-06-15', 'date'),
    ],
    'Past employment': [
      field('Previous employer', 'prevEmployer', 'Apex Health Systems'),
      field('Previous title', 'prevTitle', 'HR Operations Manager'),
      field('Prior years of experience', 'priorExperience', '8'),
      field('Most recent end date', 'recentEndDate', '2025-08-20', 'date'),
      field('Reason for leaving', 'reasonLeaving', 'Career growth'),
      field('Rehire eligible', 'rehireEligible', 'Yes', 'select', ['Yes', 'No']),
      field('Background check status', 'backgroundCheck', 'Cleared', 'select', ['Pending', 'Cleared', 'Action needed']),
      field('Reference check status', 'referenceCheck', 'Completed', 'select', ['Pending', 'Completed']),
    ],
    'Custom fields': [
      field('Cost center', 'costCenter', 'PEO-1142'),
      field('Business unit', 'businessUnit', 'G&A'),
      field('Division', 'division', 'People Operations'),
      field('Region', 'region', 'North America', 'select', ['North America', 'EMEA', 'APAC', 'LATAM']),
      field('Worker segment', 'workerSegment', 'Corporate', 'select', ['Corporate', 'Field', 'Executive']),
      field('Union status', 'unionStatus', 'Not represented', 'select', ['Not represented', 'Represented']),
      field('Works council', 'worksCouncil', 'Not applicable', 'select', ['Not applicable', 'Required']),
      field('Internal nickname', 'nickname', employee.firstName),
    ],
  }
}

export default function EmployeeProfile({ employeeId, onNavigate }) {
  const employee = EMPLOYEES.find((emp) => emp.id === employeeId)
  const details = useMemo(() => (employee ? deriveProfileValues(employee) : null), [employee])

  const [activeTab, setActiveTab] = useState('Role information')
  const [isEditingTab, setIsEditingTab] = useState(false)
  const [isChangelogOpen, setIsChangelogOpen] = useState(false)
  const [revealed, setRevealed] = useState({
    'summary.baseCompensation': false,
    'summary.compensationTimePeriod': false,
    'summary.ssn': false,
  })

  const initialTabFields = useMemo(
    () => (employee && details ? buildTabFields(employee, details) : {}),
    [employee, details]
  )
  const [tabFields, setTabFields] = useState(initialTabFields)
  const [draftTabFields, setDraftTabFields] = useState(initialTabFields)
  const [changelogEntries, setChangelogEntries] = useState(() =>
    employee && details ? buildInitialChangelog(employee, details) : []
  )

  useEffect(() => {
    setTabFields(initialTabFields)
    setDraftTabFields(initialTabFields)
    setIsEditingTab(false)
    setActiveTab('Role information')
    setIsChangelogOpen(false)
    setChangelogEntries(employee && details ? buildInitialChangelog(employee, details) : [])
  }, [initialTabFields, employeeId])

  if (!employee || !details) {
    return (
      <div className="flex-1 p-6 bg-rippling-surface">
        <div className="max-w-[1120px] mx-auto">
          <p className="text-rippling-ink text-sm">Employee not found.</p>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'list' })}
            className="mt-2 text-sm text-rippling-primary hover:underline"
          >
            Back to People
          </button>
        </div>
      </div>
    )
  }

  const fieldsForTab = (isEditingTab ? draftTabFields : tabFields)[activeTab] || []

  function toggleReveal(key) {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function updateDraftField(key, value) {
    setDraftTabFields((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] || []).map((item) =>
        item.key === key ? { ...item, value } : item
      ),
    }))
  }

  function startEdit() {
    setDraftTabFields(tabFields)
    setIsEditingTab(true)
  }

  function cancelEdit() {
    setDraftTabFields(tabFields)
    setIsEditingTab(false)
  }

  function saveEdit() {
    const newEntries = buildFieldChangeLogEntries(tabFields, draftTabFields, activeTab)
    setTabFields(draftTabFields)
    if (newEntries.length > 0) {
      setChangelogEntries((prev) => [...newEntries, ...prev])
    }
    setIsEditingTab(false)
  }

  return (
    <div className="flex-1 min-h-0 bg-white">
      <div className="h-full flex min-w-0">
        <div className="flex-1 min-w-0 overflow-auto">
          <div className="max-w-[1280px] mx-auto">
        <section className="bg-white border-b border-rippling-line px-5 py-4">
          <div className="text-[12px] text-rippling-muted mb-4 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onNavigate({ name: 'list' })}
              className="rounded-sm px-1 -ml-1 ui-interactive-chip hover:text-rippling-ink transition-colors"
            >
              People
            </button>
            <ChevronRight size={12} strokeWidth={2} />
            <span>{employee.fullName}&apos;s Profile</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={classNames(
                  'w-14 h-14 rounded-full flex items-center justify-center text-white text-[16px] font-semibold',
                  avatarClass(employee.fullName)
                )}
              >
                {initials(employee.fullName)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[22px] font-semibold text-rippling-ink tracking-tight">
                    {employee.fullName}
                  </h1>
                  <span
                    className={classNames(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
                      STATUS_STYLES[employee.status] || STATUS_STYLES.Active
                    )}
                  >
                    {employee.status}
                  </span>
                </div>
                <p className="text-[13px] text-rippling-muted mt-0.5">{employee.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <OutlineButton icon={Network}>Org chart</OutlineButton>
              <OutlineButton icon={Clock3} onClick={() => setIsChangelogOpen((prev) => !prev)}>
                View Changelog
              </OutlineButton>
              <button
                type="button"
                className="h-8 w-8 rounded-md border border-rippling-line text-rippling-ink-2 ui-interactive hover:border-rippling-ink-2/20 flex items-center justify-center transition-colors"
              >
                <MoreHorizontal size={16} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white border-b border-rippling-line px-5 py-4">
          <div className="grid grid-cols-5 gap-x-6 gap-y-4 pr-20">
            <Field label="Employment type" value={employmentLabel(employee.employmentType)} />
            <Field label="Department" value={details.departmentDisplay} />
            <Field label="Work location" value={displayLocation(employee.location)} />
            <Field label="Work email" value={employee.email || '-'} />
            <Field label="Start date" value={formatDate(employee.startDate)} />
            <Field label="Manager" isLink value={managerDisplay(employee.manager)} />
            <SensitiveField
              label="Base compensation"
              value={details.baseCompensation}
              shown={revealed['summary.baseCompensation']}
              onToggle={() => toggleReveal('summary.baseCompensation')}
            />
            <SensitiveField
              label="Compensation time period"
              value={details.compensationTimePeriod}
              shown={revealed['summary.compensationTimePeriod']}
              onToggle={() => toggleReveal('summary.compensationTimePeriod')}
            />
            <Field label="National number" value={details.nationalNumber} />
            <Field label="Is currently on leave" value={details.isCurrentlyOnLeave} />
            <SensitiveField
              label="SSN"
              value={details.ssn}
              shown={revealed['summary.ssn']}
              onToggle={() => toggleReveal('summary.ssn')}
            />
            <Field label="Last day of work" value={details.lastDayOfWork} />
            <Field label="Date of birth" value={details.dateOfBirth} />
            <Field label="Full home address" value={details.fullHomeAddress} />
            <Field label="Personal email" value={details.personalEmail} />
            <Field label="Preferred first name" value={details.preferredFirstName} />
            <Field label="Overtime exemption" value={details.overtimeExemption} />
            <Field label="Contractor" value={employee.employmentType === 'Contractor' ? 'True' : 'False'} />
            <Field label="Is a manager" value={details.isManager} />
            <Field label="Legal gender" value={details.legalGender} />
          </div>
        </section>

        {employee.status === 'Onboarding' && (
          <section className="bg-rippling-surface-2 border-b border-rippling-line px-5 py-3 flex items-center gap-2 text-[13px] text-rippling-ink-2">
            <Info size={15} strokeWidth={1.75} className="text-rippling-primary shrink-0" />
            <span>SSN was expected to be received by October 31, 2025</span>
          </section>
        )}

        <section className="px-5 py-4">
          <div className="grid grid-cols-[220px_1fr] min-h-[420px] bg-white border border-rippling-line">
            <aside className="py-2 max-h-[620px] overflow-y-auto border-r border-rippling-line">
              {PROFILE_TABS.map((tab) => {
                const isActive = tab === activeTab
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab)
                      setIsEditingTab(false)
                    }}
                    className={classNames(
                      'w-full h-9 px-3 text-left text-[13px] border-l-[3px] rounded-r-md transition-colors flex items-center justify-between ui-interactive',
                      isActive
                        ? 'border-rippling-plum text-rippling-plum font-semibold bg-rippling-chip shadow-[inset_0_0_0_1px_rgba(72,17,56,0.08)]'
                        : 'border-transparent text-rippling-muted hover:text-rippling-ink hover:bg-rippling-surface'
                    )}
                  >
                    <span>{tab}</span>
                  </button>
                )
              })}
            </aside>

            <div className="p-4">
              <div className="flex items-center justify-between pb-3 border-b border-rippling-line-2">
                <h2 className="text-[25px] font-semibold text-rippling-ink tracking-tight">{activeTab}</h2>
                {!isEditingTab ? (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="h-8 px-3 rounded-md border border-rippling-line text-[13px] text-rippling-ink-2 ui-interactive hover:border-rippling-ink-2/20 flex items-center gap-1.5 font-medium transition-colors"
                  >
                    <Pencil size={13} strokeWidth={1.75} />
                    <span>Edit</span>
                  </button>
                ) : null}
              </div>

              {!isEditingTab ? (
                <div className="grid grid-cols-2 gap-x-14 gap-y-5 pt-4">
                  {fieldsForTab.map((item) => (
                    <ViewField
                      key={item.key}
                      field={item}
                      revealed={revealed[`${activeTab}.${item.key}`]}
                      onToggleReveal={() => toggleReveal(`${activeTab}.${item.key}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="pt-4 space-y-3">
                  {fieldsForTab.map((item) => (
                    <EditRow key={item.key} label={item.label} hasInfo={item.type === 'select'}>
                      <FieldInput field={item} onChange={(value) => updateDraftField(item.key, value)} />
                    </EditRow>
                  ))}

                  <div className="flex items-center justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="h-8 px-3 rounded-md border border-rippling-line text-[13px] text-rippling-ink-2 ui-interactive hover:border-rippling-ink-2/20 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="h-8 px-3 rounded-md bg-rippling-plum text-white text-[13px] font-medium hover:bg-rippling-plum-hover transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

          </div>
        </div>
        <ChangelogDrawer
          isOpen={isChangelogOpen}
          employee={employee}
          entries={changelogEntries}
          onClose={() => setIsChangelogOpen(false)}
        />
      </div>
    </div>
  )
}

function OutlineButton({ icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 px-3 rounded-md border border-rippling-line text-[13px] text-rippling-ink-2 ui-interactive hover:border-rippling-ink-2/20 flex items-center gap-1.5 font-medium transition-colors"
    >
      <Icon size={14} strokeWidth={1.75} />
      <span>{children}</span>
    </button>
  )
}

function ChangelogDrawer({ isOpen, employee, entries, onClose }) {
  return (
    <aside
      aria-hidden={!isOpen}
      className={classNames(
        'h-full shrink-0 border-l border-rippling-line bg-white flex flex-col overflow-hidden transition-[width,opacity] duration-200 ease-out',
        isOpen ? 'w-[440px] opacity-100' : 'w-0 opacity-0 border-l-0'
      )}
    >
      <div className="h-14 px-5 border-b border-rippling-line flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-rippling-ink">Changelog</h3>
          <p className="text-[12px] text-rippling-muted">{employee.fullName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-md border border-rippling-line text-rippling-muted hover:text-rippling-ink-2 hover:border-rippling-ink-2/20 transition-colors flex items-center justify-center"
          aria-label="Close changelog panel"
        >
          <X size={15} strokeWidth={1.9} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {entries.length === 0 ? (
          <p className="text-[13px] text-rippling-muted">No changes have been recorded for this employee yet.</p>
        ) : (
          <ol className="space-y-4">
            {entries.map((entry, index) => {
              const isLast = index === entries.length - 1
              return (
                <li key={entry.id} className="relative pl-7">
                  {!isLast && <span className="absolute left-[7px] top-6 bottom-[-18px] w-px bg-rippling-line" />}
                  <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-rippling-primary bg-white" />

                  <div className="rounded-md border border-rippling-line-2 px-3 py-2.5">
                    <p className="text-[12px] text-rippling-muted">
                      {entry.actorName || 'Unknown user'}
                      {entry.actorRole ? ` (${entry.actorRole})` : ''} • {formatDateTime(entry.changedAt)}
                    </p>
                    <p className="mt-1 text-[13px] text-rippling-ink font-medium">
                      {entry.section} → {entry.fieldLabel}
                    </p>
                    <p className="mt-1 text-[12.5px] text-rippling-ink-2 break-words">
                      <span className="text-rippling-muted">From:</span> {entry.oldValue}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-rippling-ink-2 break-words">
                      <span className="text-rippling-muted">To:</span> {entry.newValue}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </aside>
  )
}

function Field({ label, value, isLink = false }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-rippling-muted font-medium">{label}</div>
      {isLink ? (
        <button type="button" className="mt-0.5 text-[13.5px] font-semibold text-rippling-primary hover:underline text-left">
          {value || '-'}
        </button>
      ) : (
        <div className="mt-0.5 text-[13.5px] font-semibold text-rippling-ink break-words leading-5">{value || '-'}</div>
      )}
    </div>
  )
}

function SensitiveField({ label, value, shown, onToggle }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-rippling-muted font-medium">{label}</div>
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className="text-[13.5px] font-semibold text-rippling-ink">{shown ? value : MASKED_VALUE}</span>
        <button
          type="button"
          onClick={onToggle}
          className="h-5 w-5 rounded ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink-2 transition-colors"
          aria-label={shown ? `Hide ${label}` : `Show ${label}`}
        >
          {shown ? <EyeOff size={14} strokeWidth={1.8} /> : <Eye size={14} strokeWidth={1.8} />}
        </button>
      </div>
    </div>
  )
}

function ViewField({ field, revealed, onToggleReveal }) {
  const value = field.value || '-'
  const hasSensitiveValue = field.type === 'sensitive'

  return (
    <div>
      <div className="text-[13px] font-medium text-rippling-ink flex items-center gap-1">
        <span>{field.label}</span>
        {field.type === 'select' && <CircleHelp size={12} strokeWidth={1.75} className="text-rippling-muted" />}
      </div>
      {hasSensitiveValue ? (
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-[13px] text-rippling-ink">{revealed ? value : MASKED_VALUE}</span>
          <button
            type="button"
            onClick={onToggleReveal}
            className="h-5 w-5 rounded ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink-2 transition-colors"
            aria-label={revealed ? `Hide ${field.label}` : `Show ${field.label}`}
          >
            {revealed ? <EyeOff size={14} strokeWidth={1.8} /> : <Eye size={14} strokeWidth={1.8} />}
          </button>
        </div>
      ) : (
        <div className="text-[13px] mt-1 text-rippling-ink whitespace-pre-wrap leading-5">{value}</div>
      )}
    </div>
  )
}

function EditRow({ label, children, hasInfo = false }) {
  return (
    <div className="grid grid-cols-[220px_1fr] gap-4 items-start">
      <label className="text-[13px] text-rippling-ink font-medium pt-1 flex items-center gap-1">
        <span>{label}</span>
        {hasInfo && <CircleHelp size={12} strokeWidth={1.75} className="text-rippling-muted" />}
      </label>
      {children}
    </div>
  )
}

