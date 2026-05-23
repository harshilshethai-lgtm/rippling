export type WorklistEmployee = {
  id: string
  fullName: string
  email: string
  title: string
  department: string
  level: 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8'
  city: string
  country: string
  location: string
  employmentType: 'FTE' | 'Contractor' | 'Intern'
  tenureMonths: number
  managerId: string | null
  managerName: string
  status: 'active' | 'on_leave' | 'terminated'
  hasEditAccess: boolean
}

type SeedRow = Omit<WorklistEmployee, 'managerName' | 'location'> & { city: string; country: string }

const rows: SeedRow[] = [
  { id: 'e-001', fullName: 'Maya Singh', email: 'maya.singh@ripco.com', title: 'Chief Executive Officer', department: 'Operations', level: 'L8', city: 'San Francisco', country: 'US', employmentType: 'FTE', tenureMonths: 86, managerId: null, status: 'active', hasEditAccess: true },
  { id: 'e-002', fullName: 'Daniel Wu', email: 'daniel.wu@ripco.com', title: 'VP Engineering', department: 'Engineering', level: 'L7', city: 'San Francisco', country: 'US', employmentType: 'FTE', tenureMonths: 58, managerId: 'e-001', status: 'active', hasEditAccess: true },
  { id: 'e-003', fullName: 'Arielle Thomas', email: 'arielle.thomas@ripco.com', title: 'Director of Sales', department: 'Sales', level: 'L7', city: 'New York', country: 'US', employmentType: 'FTE', tenureMonths: 48, managerId: 'e-001', status: 'active', hasEditAccess: true },
  { id: 'e-004', fullName: 'Nikhil Rao', email: 'nikhil.rao@ripco.com', title: 'VP People', department: 'People', level: 'L7', city: 'Austin', country: 'US', employmentType: 'FTE', tenureMonths: 63, managerId: 'e-001', status: 'active', hasEditAccess: true },
  { id: 'e-005', fullName: 'Sofia Alvarez', email: 'sofia.alvarez@ripco.com', title: 'Director of Finance', department: 'Finance', level: 'L7', city: 'London', country: 'UK', employmentType: 'FTE', tenureMonths: 55, managerId: 'e-001', status: 'active', hasEditAccess: true },
  { id: 'e-006', fullName: 'Farah Khan', email: 'farah.khan@ripco.com', title: 'VP Marketing', department: 'Marketing', level: 'L7', city: 'Berlin', country: 'DE', employmentType: 'FTE', tenureMonths: 42, managerId: 'e-001', status: 'active', hasEditAccess: true },

  { id: 'e-007', fullName: 'Priyanka Iyer', email: 'priyanka.iyer@ripco.com', title: 'Engineering Manager', department: 'Engineering', level: 'L6', city: 'San Francisco', country: 'US', employmentType: 'FTE', tenureMonths: 40, managerId: 'e-002', status: 'active', hasEditAccess: true },
  { id: 'e-008', fullName: 'Jonas Becker', email: 'jonas.becker@ripco.com', title: 'Engineering Manager', department: 'Engineering', level: 'L6', city: 'Berlin', country: 'DE', employmentType: 'FTE', tenureMonths: 35, managerId: 'e-002', status: 'active', hasEditAccess: true },
  { id: 'e-009', fullName: 'Mina Park', email: 'mina.park@ripco.com', title: 'Staff Engineer', department: 'Engineering', level: 'L6', city: 'New York', country: 'US', employmentType: 'FTE', tenureMonths: 44, managerId: 'e-007', status: 'active', hasEditAccess: true },
  { id: 'e-010', fullName: 'Abdul Rahman', email: 'abdul.rahman@ripco.com', title: 'Senior Software Engineer', department: 'Engineering', level: 'L5', city: 'Austin', country: 'US', employmentType: 'FTE', tenureMonths: 26, managerId: 'e-007', status: 'active', hasEditAccess: true },
  { id: 'e-011', fullName: 'Li Wei', email: 'li.wei@ripco.com', title: 'Software Engineer', department: 'Engineering', level: 'L4', city: 'Bangalore', country: 'IN', employmentType: 'FTE', tenureMonths: 21, managerId: 'e-007', status: 'active', hasEditAccess: true },
  { id: 'e-012', fullName: 'Carmen Diaz', email: 'carmen.diaz@ripco.com', title: 'Software Engineer', department: 'Engineering', level: 'L4', city: 'London', country: 'UK', employmentType: 'FTE', tenureMonths: 18, managerId: 'e-008', status: 'active', hasEditAccess: true },
  { id: 'e-013', fullName: 'Tariq Hassan', email: 'tariq.hassan@ripco.com', title: 'Software Engineer', department: 'Engineering', level: 'L3', city: 'Berlin', country: 'DE', employmentType: 'FTE', tenureMonths: 11, managerId: 'e-008', status: 'active', hasEditAccess: false },
  { id: 'e-014', fullName: 'Linh Tran', email: 'linh.tran@ripco.com', title: 'QA Engineer', department: 'Engineering', level: 'L3', city: 'Bangalore', country: 'IN', employmentType: 'Contractor', tenureMonths: 9, managerId: 'e-008', status: 'active', hasEditAccess: true },
  { id: 'e-015', fullName: 'Noah Osei', email: 'noah.osei@ripco.com', title: 'Engineering Intern', department: 'Engineering', level: 'L2', city: 'Austin', country: 'US', employmentType: 'Intern', tenureMonths: 3, managerId: 'e-007', status: 'active', hasEditAccess: true },

  { id: 'e-016', fullName: 'Riya Patel', email: 'riya.patel@ripco.com', title: 'Sales Manager', department: 'Sales', level: 'L6', city: 'New York', country: 'US', employmentType: 'FTE', tenureMonths: 39, managerId: 'e-003', status: 'active', hasEditAccess: true },
  { id: 'e-017', fullName: 'John Lee', email: 'john.lee.eng@ripco.com', title: 'Account Executive', department: 'Sales', level: 'L4', city: 'New York', country: 'US', employmentType: 'FTE', tenureMonths: 19, managerId: 'e-016', status: 'active', hasEditAccess: true },
  { id: 'e-018', fullName: 'John Lee', email: 'john.lee.sales@ripco.com', title: 'Account Executive', department: 'Sales', level: 'L4', city: 'London', country: 'UK', employmentType: 'FTE', tenureMonths: 17, managerId: 'e-016', status: 'active', hasEditAccess: true },
  { id: 'e-019', fullName: 'Amelia Brooks', email: 'amelia.brooks@ripco.com', title: 'Senior Account Executive', department: 'Sales', level: 'L5', city: 'Austin', country: 'US', employmentType: 'FTE', tenureMonths: 29, managerId: 'e-016', status: 'active', hasEditAccess: true },
  { id: 'e-020', fullName: 'Zaid Mahmood', email: 'zaid.mahmood@ripco.com', title: 'Sales Development Rep', department: 'Sales', level: 'L3', city: 'Berlin', country: 'DE', employmentType: 'FTE', tenureMonths: 8, managerId: 'e-016', status: 'active', hasEditAccess: true },
  { id: 'e-021', fullName: 'Hannah Cole', email: 'hannah.cole@ripco.com', title: 'Sales Development Rep', department: 'Sales', level: 'L3', city: 'New York', country: 'US', employmentType: 'FTE', tenureMonths: 12, managerId: 'e-016', status: 'on_leave', hasEditAccess: true },

  { id: 'e-022', fullName: 'Tessa Morgan', email: 'tessa.morgan@ripco.com', title: 'People Ops Manager', department: 'People', level: 'L6', city: 'Austin', country: 'US', employmentType: 'FTE', tenureMonths: 41, managerId: 'e-004', status: 'active', hasEditAccess: true },
  { id: 'e-023', fullName: 'M. Chen', email: 'm.chen@ripco.com', title: 'HR Business Partner', department: 'People', level: 'L5', city: 'San Francisco', country: 'US', employmentType: 'FTE', tenureMonths: 33, managerId: 'e-022', status: 'on_leave', hasEditAccess: true },
  { id: 'e-024', fullName: 'Diego Morales', email: 'diego.morales@ripco.com', title: 'People Ops Specialist', department: 'People', level: 'L4', city: 'Austin', country: 'US', employmentType: 'FTE', tenureMonths: 16, managerId: 'e-022', status: 'active', hasEditAccess: true },
  { id: 'e-025', fullName: 'Grace Kim', email: 'grace.kim@ripco.com', title: 'People Ops Specialist', department: 'People', level: 'L4', city: 'London', country: 'UK', employmentType: 'FTE', tenureMonths: 14, managerId: 'e-022', status: 'active', hasEditAccess: true },
  { id: 'e-026', fullName: 'Samir Nair', email: 'samir.nair@ripco.com', title: 'People Ops Coordinator', department: 'People', level: 'L3', city: 'Bangalore', country: 'IN', employmentType: 'Contractor', tenureMonths: 10, managerId: 'e-022', status: 'active', hasEditAccess: true },

  { id: 'e-027', fullName: 'Ivy Campbell', email: 'ivy.campbell@ripco.com', title: 'Finance Manager', department: 'Finance', level: 'L6', city: 'London', country: 'UK', employmentType: 'FTE', tenureMonths: 46, managerId: 'e-005', status: 'active', hasEditAccess: true },
  { id: 'e-028', fullName: 'L. Park', email: 'l.park@ripco.com', title: 'Senior Financial Analyst', department: 'Finance', level: 'L5', city: 'San Francisco', country: 'US', employmentType: 'FTE', tenureMonths: 22, managerId: 'e-027', status: 'terminated', hasEditAccess: true },
  { id: 'e-029', fullName: 'Owen Clarke', email: 'owen.clarke@ripco.com', title: 'Financial Analyst', department: 'Finance', level: 'L4', city: 'Austin', country: 'US', employmentType: 'FTE', tenureMonths: 18, managerId: 'e-027', status: 'active', hasEditAccess: true },
  { id: 'e-030', fullName: 'Nadia Petrova', email: 'nadia.petrova@ripco.com', title: 'Accounting Specialist', department: 'Finance', level: 'L3', city: 'Berlin', country: 'DE', employmentType: 'FTE', tenureMonths: 13, managerId: 'e-027', status: 'active', hasEditAccess: true },

  { id: 'e-031', fullName: 'Marta Silva', email: 'marta.silva@ripco.com', title: 'Marketing Manager', department: 'Marketing', level: 'L6', city: 'Berlin', country: 'DE', employmentType: 'FTE', tenureMonths: 37, managerId: 'e-006', status: 'active', hasEditAccess: true },
  { id: 'e-032', fullName: 'Ethan Grant', email: 'ethan.grant@ripco.com', title: 'Product Marketing Manager', department: 'Marketing', level: 'L5', city: 'San Francisco', country: 'US', employmentType: 'FTE', tenureMonths: 31, managerId: 'e-031', status: 'active', hasEditAccess: true },
  { id: 'e-033', fullName: 'Aisha Bello', email: 'aisha.bello@ripco.com', title: 'Growth Marketing Manager', department: 'Marketing', level: 'L5', city: 'London', country: 'UK', employmentType: 'FTE', tenureMonths: 28, managerId: 'e-031', status: 'active', hasEditAccess: true },
  { id: 'e-034', fullName: 'Victor Huang', email: 'victor.huang@ripco.com', title: 'Content Marketing Specialist', department: 'Marketing', level: 'L4', city: 'New York', country: 'US', employmentType: 'FTE', tenureMonths: 15, managerId: 'e-031', status: 'active', hasEditAccess: true },
  { id: 'e-035', fullName: 'Saanvi Reddy', email: 'saanvi.reddy@ripco.com', title: 'Marketing Specialist', department: 'Marketing', level: 'L3', city: 'Bangalore', country: 'IN', employmentType: 'Intern', tenureMonths: 5, managerId: 'e-031', status: 'active', hasEditAccess: true },

  { id: 'e-036', fullName: 'Marcus Green', email: 'marcus.green@ripco.com', title: 'Operations Manager', department: 'Operations', level: 'L6', city: 'Austin', country: 'US', employmentType: 'FTE', tenureMonths: 38, managerId: 'e-001', status: 'active', hasEditAccess: true },
  { id: 'e-037', fullName: 'Bella Rossi', email: 'bella.rossi@ripco.com', title: 'Program Manager', department: 'Operations', level: 'L5', city: 'San Francisco', country: 'US', employmentType: 'FTE', tenureMonths: 30, managerId: 'e-036', status: 'active', hasEditAccess: true },
  { id: 'e-038', fullName: 'Kenji Sato', email: 'kenji.sato@ripco.com', title: 'Operations Analyst', department: 'Operations', level: 'L4', city: 'London', country: 'UK', employmentType: 'FTE', tenureMonths: 16, managerId: 'e-036', status: 'active', hasEditAccess: true },
  { id: 'e-039', fullName: 'Yara Okafor', email: 'yara.okafor@ripco.com', title: 'Operations Analyst', department: 'Operations', level: 'L3', city: 'Berlin', country: 'DE', employmentType: 'FTE', tenureMonths: 9, managerId: 'e-036', status: 'active', hasEditAccess: true },
  { id: 'e-040', fullName: 'Carlos Mendes', email: 'carlos.mendes@ripco.com', title: 'Operations Coordinator', department: 'Operations', level: 'L3', city: 'Bangalore', country: 'IN', employmentType: 'Contractor', tenureMonths: 7, managerId: 'e-036', status: 'active', hasEditAccess: true },

  { id: 'e-041', fullName: 'Anika Sharma', email: 'anika.sharma@ripco.com', title: 'Product Manager', department: 'Engineering', level: 'L5', city: 'New York', country: 'US', employmentType: 'FTE', tenureMonths: 25, managerId: 'e-002', status: 'active', hasEditAccess: true },
  { id: 'e-042', fullName: 'Tom Fletcher', email: 'tom.fletcher@ripco.com', title: 'Senior Product Manager', department: 'Engineering', level: 'L6', city: 'London', country: 'UK', employmentType: 'FTE', tenureMonths: 34, managerId: 'e-002', status: 'active', hasEditAccess: true },
  { id: 'e-043', fullName: 'Ruby Nguyen', email: 'ruby.nguyen@ripco.com', title: 'UX Researcher', department: 'Engineering', level: 'L4', city: 'Austin', country: 'US', employmentType: 'FTE', tenureMonths: 18, managerId: 'e-042', status: 'active', hasEditAccess: true },
  { id: 'e-044', fullName: 'Theo Hammond', email: 'theo.hammond@ripco.com', title: 'Design Technologist', department: 'Engineering', level: 'L4', city: 'Berlin', country: 'DE', employmentType: 'FTE', tenureMonths: 17, managerId: 'e-042', status: 'active', hasEditAccess: true },
  { id: 'e-045', fullName: 'Harini Subramanian', email: 'harini.subramanian@ripco.com', title: 'Senior Software Engineer', department: 'Engineering', level: 'L5', city: 'Bangalore', country: 'IN', employmentType: 'FTE', tenureMonths: 28, managerId: 'e-009', status: 'active', hasEditAccess: true },
  { id: 'e-046', fullName: 'Luca Bianchi', email: 'luca.bianchi@ripco.com', title: 'Software Engineer', department: 'Engineering', level: 'L4', city: 'London', country: 'UK', employmentType: 'FTE', tenureMonths: 20, managerId: 'e-009', status: 'on_leave', hasEditAccess: true },
  { id: 'e-047', fullName: 'Fatima Noor', email: 'fatima.noor@ripco.com', title: 'Data Analyst', department: 'Operations', level: 'L4', city: 'San Francisco', country: 'US', employmentType: 'FTE', tenureMonths: 24, managerId: 'e-036', status: 'active', hasEditAccess: true },
  { id: 'e-048', fullName: 'Jacob White', email: 'jacob.white@ripco.com', title: 'Revenue Operations Analyst', department: 'Sales', level: 'L4', city: 'Austin', country: 'US', employmentType: 'FTE', tenureMonths: 16, managerId: 'e-016', status: 'active', hasEditAccess: true },
  { id: 'e-049', fullName: 'Emily Zhao', email: 'emily.zhao@ripco.com', title: 'Customer Success Manager', department: 'People', level: 'L5', city: 'New York', country: 'US', employmentType: 'FTE', tenureMonths: 29, managerId: 'e-004', status: 'active', hasEditAccess: true },
  { id: 'e-050', fullName: 'George Okoye', email: 'george.okoye@ripco.com', title: 'Compensation Analyst', department: 'Finance', level: 'L4', city: 'London', country: 'UK', employmentType: 'FTE', tenureMonths: 15, managerId: 'e-027', status: 'active', hasEditAccess: true },
]

export const WORKLIST_EMPLOYEES: WorklistEmployee[] = rows.map((row) => ({
  ...row,
  location: `${row.city}, ${row.country}`,
  managerName: row.managerId ? rows.find((candidate) => candidate.id === row.managerId)?.fullName || 'Unknown' : 'Board',
}))

export const AI_PROMPT_PRESETS: Record<
  string,
  { chips: Array<{ attribute: string; operator: string; value: string }>; note: string }
> = {
  'all engineers in nyc who report to maya': {
    chips: [
      { attribute: 'Department', operator: 'is', value: 'Engineering' },
      { attribute: 'Location', operator: 'contains', value: 'New York' },
      { attribute: 'Manager', operator: 'contains', value: 'Maya Singh' },
    ],
    note: 'Engineering + New York + manager chain to Maya',
  },
  'sales reps in europe': {
    chips: [
      { attribute: 'Department', operator: 'is', value: 'Sales' },
      { attribute: 'Location', operator: 'is one of', value: 'London, Berlin' },
      { attribute: 'Title', operator: 'contains', value: 'Rep' },
    ],
    note: 'Sales representatives in EMEA hubs',
  },
  'people team in austin': {
    chips: [
      { attribute: 'Department', operator: 'is', value: 'People' },
      { attribute: 'Location', operator: 'contains', value: 'Austin' },
    ],
    note: 'People org in Austin',
  },
  'new engineers under one year': {
    chips: [
      { attribute: 'Department', operator: 'is', value: 'Engineering' },
      { attribute: 'Tenure', operator: 'is', value: '< 12' },
    ],
    note: 'Engineering hires with less than 12 months tenure',
  },
}
