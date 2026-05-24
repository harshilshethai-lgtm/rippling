import { EMPLOYEES } from '../../../data/employees'

/**
 * Mirrors the synthetic profile data generated in EmployeeProfile.deriveProfileValues.
 * Kept here (rather than imported from EmployeeProfile) so the Define Changes
 * canvas can resolve "current value" for any (employee, fieldKey) without
 * pulling the profile UI into its dependency graph.
 */
function deriveProfileValues(employee) {
  const idx = Number(String(employee.id).replace('emp-', '')) || 1
  const baseComp = 110000 + (idx % 14) * 5000
  const profileDepartment =
    employee.department === 'People' ? 'People Operations' : employee.department

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
    departmentDisplay: profileDepartment,
    departmentPath: `G&A > ${profileDepartment}`,
    mobilePhone: `+1 (415) 555-${String(1300 + idx).slice(-4)}`,
    workPhone: `+1 (650) 555-${String(2200 + idx).slice(-4)}`,
    preferredPronouns: idx % 3 === 0 ? 'she/her' : idx % 3 === 1 ? 'he/him' : 'they/them',
    maritalStatus: ['Single', 'Married', 'Domestic Partnership'][idx % 3],
    emergencyContact: 'Jamie Wilson',
    emergencyContactPhone: '+1 (415) 555-0198',
    countryOfCitizenship: 'United States',
    visaStatus:
      employee.location.includes('US') || employee.location === 'Remote (US)' ? 'N/A' : 'Work Visa',
    linkedIn: `linkedin.com/in/${employee.firstName.toLowerCase()}-${employee.lastName.toLowerCase()}`,
    github: `github.com/${employee.firstName.toLowerCase()}${employee.lastName.toLowerCase()}`,
    preferredLanguage: 'English',
    jobCode: `JOB-${String(4000 + idx)}`,
    fte:
      employee.employmentType === 'Part-time'
        ? '0.5'
        : employee.employmentType === 'Contractor'
        ? '0.0'
        : '1.0',
  }
}

function displayLocation(location) {
  if (!location) return '-'
  if (location.startsWith('Remote')) return 'Remote'
  return location
}

function managerDisplay(manager) {
  if (!manager || manager === 'Board of Directors') return 'Unassigned'
  return manager
}

/**
 * Build the full value map for a single employee. Keys match FIELDS_BY_KEY in
 * fieldSchema.js. Values are display strings (formatted) — the same strings the
 * profile page renders.
 *
 * Static rows (department path, business partners, plans, etc.) are intentionally
 * synthetic — they mirror what the single user page shows today.
 */
function buildFieldValueMap(employee) {
  const details = deriveProfileValues(employee)
  const directReports = EMPLOYEES.filter((emp) => emp.managerId === employee.id)
  const directReportNames =
    directReports.slice(0, 8).map((emp) => emp.fullName).join(', ') || '-'
  const managerLabel = managerDisplay(employee.manager)
  const workLocationLabel = displayLocation(employee.location)

  return {
    legalEntity: 'Acme, Inc.',
    title: employee.title,
    department: details.departmentDisplay,
    departmentPath: details.departmentPath,
    level: 'P3',
    teams: 'People Operations',
    jobFamily: 'Administrative Support',
    duties: 'Own employee lifecycle operations and workforce records.',
    workEmailAccess: 'Yes',
    manager: managerLabel,
    workLocation: workLocationLabel,
    state: 'California',

    preferredFirstName: details.preferredFirstName,
    dateOfBirth: details.dateOfBirth,
    legalGender: details.legalGender,
    preferredPronouns: details.preferredPronouns,
    maritalStatus: details.maritalStatus,
    nationalNumber: details.nationalNumber,
    personalEmail: details.personalEmail,
    mobilePhone: details.mobilePhone,
    homeAddress: details.fullHomeAddress,
    emergencyContact: details.emergencyContact,
    emergencyContactPhone: details.emergencyContactPhone,

    countryOfCitizenship: details.countryOfCitizenship,
    visaStatus: details.visaStatus,
    preferredLanguage: details.preferredLanguage,
    linkedin: details.linkedIn,
    github: details.github,
    shirtSize: details.tshirtSize,
    dietary: 'None',
    notes: 'Remote-first worker. Attends monthly team offsite.',

    currentCycle: 'FY26 Q2',
    cadence: 'Semi-annual',
    nextReview: '2026-08-15',
    managerReviewer: managerLabel,
    selfReviewStatus: 'In progress',
    peerReviewCount: '3',
    calibrationStatus: 'Scheduled',
    performanceTrend: 'Exceeding expectations',

    hrbp: 'Celeste Stephens',
    recruiter: 'Maya Patel',
    financePartner: 'Rachel Kim',
    itPartner: 'Diego Reyes',
    legalPartner: 'Aditi Brown',
    payrollPartner: 'Noah Thompson',
    benefitsPartner: 'Olivia Chen',
    escalationChannel: '#people-ops-escalations',

    employmentType: employee.employmentType,
    workerType: employee.employmentType === 'Contractor' ? 'Contingent worker' : 'Employee',
    jobCode: details.jobCode,
    fte: details.fte,
    startDate: employee.startDate,
    jobsManager: managerLabel,
    jobsWorkLocation: workLocationLabel,
    timeZone: 'Pacific Time',

    directReportCount: String(directReports.length),
    directReports: directReportNames,
    openReqs: '2',
    headcountTarget: String(Math.max(3, directReports.length + 2)),
    skipLevelCadence: 'Monthly',
    officeHours: 'Fridays, 2:00 PM PT',
    orgChartVisibility: 'Enabled',

    offerLetter: 'Signed',
    i9: 'Completed',
    w4: 'On file',
    directDepositAuth: 'On file',
    handbookAck: 'Signed',
    nda: 'Signed',
    recentUpload: '2026-04-18',
    retentionTag: '7 years',

    baseCompensation: details.baseCompensation,
    compPeriod: details.compensationTimePeriod,
    paySchedule: 'Bi-weekly',
    payGroup: 'US Salaried',
    overtimeExemption: details.overtimeExemption,
    bonusTarget: '10%',
    equityEligibility: 'Eligible',
    bankAccount: '4321',
    federalWithholding: 'Single, 1 allowance',
    stateWithholding: 'California standard',

    expensePolicy: 'Standard Employee Policy',
    approver: managerLabel,
    corporateCard: 'Issued',
    cardLimit: '$5,000 / month',
    reimbursementMethod: 'Payroll',
    lastExpenseDate: '2026-05-03',
    outstandingReimbursements: '$242.10',
    travelTier: 'Tier 2',

    medicalPlan: 'Blue Shield PPO Gold',
    dentalPlan: 'Delta Dental Premium',
    visionPlan: 'VSP Choice',
    retirement: 'Enrolled - 6%',
    hsaFsa: 'HSA Enabled',
    lifeInsurance: '2x base salary',
    dependentsCovered: '2',
    coverageDate: '2025-09-01',

    gsuite: 'Provisioned',
    slack: 'Active',
    jira: 'Active',
    githubAccess: 'Active',
    notion: 'Active',
    zoom: 'Licensed',
    lastSync: '2026-05-18',
    accessProfile: 'People Ops - Manager',

    primaryDevice: 'MacBook Pro 14" (M3)',
    serialNumber: 'C02YX8ABMD6R',
    deviceStatus: 'Compliant',
    assignedDate: '2025-09-03',
    mdmProfile: 'Rippling MDM - Standard',
    diskEncryption: 'Enabled',
    osVersion: 'macOS 14.7',
    accessories: 'Dock, Monitor, Keyboard, Mouse',

    primary2fa: 'Okta Verify Push',
    backup2fa: 'SMS',
    securityKeys: '1',
    backupCodes: 'Yes',
    last2faReset: '2026-03-11',
    recoveryEmail: employee.email,
    twoFaCompliance: 'Compliant',

    ssoProvider: 'Okta',
    accountStatus: 'Active',
    passwordChanged: '2026-04-09',
    sessionTimeout: '12 hours',
    mfaEnforcement: 'Required',
    ipRestrictions: 'Corporate + VPN',
    lastSignin: '2026-05-19',
    failedSignins: '1',

    compBand: 'P3 - Midpoint $132,000',
    compaRatio: '0.96',
    currency: 'USD',
    meritCycle: 'Annual - April',
    lastIncreaseDate: '2026-04-01',
    lastIncreaseAmount: '$7,500',
    ttc: '$145,000',
    eligibilityStatus: 'Eligible',

    requiredTrainings: '7',
    completedTrainings: '6',
    completionRate: '86%',
    overdueTrainings: '1',
    lastCourse: 'Preventing Workplace Harassment',
    learningPath: 'People Manager Onboarding',
    certificationStatus: 'In progress',
    nextDueDate: '2026-06-15',

    prevEmployer: 'Apex Health Systems',
    prevTitle: 'HR Operations Manager',
    priorExperience: '8',
    recentEndDate: '2025-08-20',
    reasonLeaving: 'Career growth',
    rehireEligible: 'Yes',
    backgroundCheck: 'Cleared',
    referenceCheck: 'Completed',

    costCenter: 'PEO-1142',
    businessUnit: 'G&A',
    division: 'People Operations',
    region: 'North America',
    workerSegment: 'Corporate',
    unionStatus: 'Not represented',
    worksCouncil: 'Not applicable',
    nickname: employee.firstName,
  }
}

// Per-employee memoization so the table doesn't recompute the entire value map
// on every cell render. EMPLOYEES is module-static so this map is stable.
const valueMapCache = new WeakMap()

export function getEmployeeValueMap(employee) {
  if (!employee) return {}
  let cached = valueMapCache.get(employee)
  if (!cached) {
    cached = buildFieldValueMap(employee)
    valueMapCache.set(employee, cached)
  }
  return cached
}

export function getCurrentValue(employee, fieldKey) {
  if (!employee || !fieldKey) return ''
  const map = getEmployeeValueMap(employee)
  const value = map[fieldKey]
  return value === undefined || value === null ? '' : String(value)
}
