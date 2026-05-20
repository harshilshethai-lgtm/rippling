// 100 fake employees for the prototype
// Diverse names, realistic title/dept/location distribution, manager chains

const firstNames = [
  'Aarav', 'Aditi', 'Alex', 'Alice', 'Amara', 'Ananya', 'Andrew', 'Anjali', 'Bella', 'Ben',
  'Carlos', 'Caroline', 'Chen', 'Chloe', 'Connor', 'Daniel', 'David', 'Diego', 'Elena', 'Emily',
  'Emma', 'Ethan', 'Fatima', 'Felix', 'Grace', 'Hannah', 'Hassan', 'Hiroshi', 'Imani', 'Isabella',
  'Jack', 'Jacob', 'Jamal', 'James', 'Jasmine', 'Jason', 'Jeff', 'Jenny', 'John', 'Jonathan',
  'Julia', 'Kai', 'Karen', 'Kavya', 'Kenji', 'Kim', 'Lance', 'Laura', 'Lena', 'Liam',
  'Lily', 'Lucas', 'Maria', 'Marcus', 'Marta', 'Mateo', 'Maya', 'Mei', 'Michael', 'Mia',
  'Mira', 'Nadia', 'Nathan', 'Nia', 'Noah', 'Olivia', 'Omar', 'Owen', 'Panapar', 'Priya',
  'Quincy', 'Rachel', 'Rahul', 'Raj', 'Riya', 'Ruby', 'Ryan', 'Sarah', 'Samuel', 'Sofia',
  'Sophia', 'Tara', 'Tariq', 'Theo', 'Thomas', 'Umesh', 'Vidhi', 'Victor', 'Vincent', 'Wei',
  'William', 'Xiaomei', 'Yara', 'Yusuf', 'Zara', 'Zoe', 'Bryce', 'Connor', 'Eric', 'Fleda',
]

const lastNames = [
  'Anderson', 'Bell', 'Borders', 'Brown', 'Chen', 'Cholankeril', 'Clark', 'Davis', 'Garcia', 'Gibson',
  'Hall', 'Hernandez', 'Hoffman', 'Jackson', 'Jafrin', 'Johnson', 'Jones', 'Kim', 'King', 'Lee',
  'Lewis', 'Lopez', 'Martin', 'Martinez', 'MacDonald', 'Miller', 'Mitchell', 'Mo', 'Moore', 'Nakamura',
  'Pan', 'Pandya', 'Patel', 'Pfannerstill', 'Phirke', 'Reddy', 'Reyes', 'Roberts', 'Rodriguez', 'Rojrujanond',
  'Scott', 'Sheehan', 'Singh', 'Smith', 'Tanaka', 'Taylor', 'Thomas', 'Thompson', 'Walker', 'White',
  'Williams', 'Wilson', 'Woo', 'Wright', 'Yamamoto', 'Young', 'Zhang', 'Zhao',
]

const departments = [
  'Engineering',
  'Sales',
  'Customer Support',
  'Finance',
  'People',
  'Marketing',
  'Product',
  'Operations',
  'Legal',
  'IT',
]

const titlesByDept = {
  'Engineering': ['Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Engineering Manager', 'Senior Engineering Manager', 'Director of Engineering', 'VP of Engineering', 'QA Engineer', 'Senior QA Engineer', 'Integration Engineer'],
  'Sales': ['Account Executive', 'Senior Account Executive', 'Sales Development Rep', 'Sales Manager', 'Director of Sales', 'VP of Sales', 'Solutions Engineer'],
  'Customer Support': ['Support Specialist', 'Senior Support Specialist', 'Support Manager', 'Customer Success Manager', 'Lead Customer Success Manager', 'Director of Customer Success'],
  'Finance': ['Financial Analyst', 'Senior Financial Analyst', 'Accounting Manager', 'Senior Manager, Accounting', 'Controller', 'VP of Finance', 'CFO'],
  'People': ['People Ops Specialist', 'HR Business Partner', 'Senior HR Business Partner', 'People Ops Manager', 'Director of People', 'VP of People', 'CHRO'],
  'Marketing': ['Marketing Specialist', 'Content Marketing Manager', 'Product Marketing Manager', 'Growth Marketing Manager', 'Director of Marketing', 'VP of Marketing'],
  'Product': ['Product Manager', 'Senior Product Manager', 'Group Product Manager', 'Director of Product', 'VP of Product', 'Product Designer', 'Senior Product Designer'],
  'Operations': ['Operations Analyst', 'Operations Manager', 'Senior Operations Manager', 'Director of Operations', 'COO'],
  'Legal': ['Legal Counsel', 'Senior Legal Counsel', 'General Counsel', 'Paralegal'],
  'IT': ['IT Engineer', 'Senior IT Engineer', 'IT Systems Manager', 'IT Administrator', 'Director of IT'],
}

const locations = [
  { name: 'San Francisco', country: 'US', tz: 'PST' },
  { name: 'New York', country: 'US', tz: 'EST' },
  { name: 'Austin', country: 'US', tz: 'CST' },
  { name: 'Remote (US)', country: 'US', tz: '—' },
  { name: 'London', country: 'UK', tz: 'GMT' },
  { name: 'Berlin', country: 'DE', tz: 'CET' },
  { name: 'Toronto', country: 'CA', tz: 'EST' },
  { name: 'Bangalore', country: 'IN', tz: 'IST' },
  { name: 'Singapore', country: 'SG', tz: 'SGT' },
  { name: 'Remote (EMEA)', country: 'EU', tz: '—' },
]

const employmentTypes = ['Full-time', 'Full-time', 'Full-time', 'Full-time', 'Contractor', 'Part-time'] // weighted

const statuses = ['Active', 'Active', 'Active', 'Active', 'Active', 'Active', 'Active', 'On Leave', 'Onboarding']

// Seeded RNG for reproducibility (same data on every reload)
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(42)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const randInt = (n) => Math.floor(rand() * n)

const BOARD_MANAGER = 'Board of Directors'

function isManagerTitle(title) {
  return /Manager|Director|VP|Lead|Head|Chief|Counsel|COO|CFO|CHRO/.test(title)
}

function pickManagerFor(employees, dept, excludeId) {
  const inDept = employees.filter(
    (e) =>
      e.id !== excludeId &&
      e.department === dept &&
      isManagerTitle(e.title) &&
      e.manager !== BOARD_MANAGER
  )
  if (inDept.length > 0) return pick(inDept)

  const anyManager = employees.filter(
    (e) => e.id !== excludeId && isManagerTitle(e.title) && e.manager !== BOARD_MANAGER
  )
  if (anyManager.length > 0) return pick(anyManager)

  const coo = employees.find((e) => e.title === 'COO')
  if (coo && coo.id !== excludeId) return coo

  return employees.find((e) => e.id !== excludeId) || employees[0]
}

function assignManager(employee, manager) {
  employee.manager = manager.fullName
  employee.managerId = manager.id
}

/** Leadership has no manager in step 1; wire everyone into a single chain. */
function ensureEveryoneHasManager(employees) {
  const coo = employees.find((e) => e.title === 'COO')
  const apex = coo || employees[0]

  for (const emp of employees) {
    if (emp.manager) continue

    if (emp.id === apex.id) {
      emp.manager = BOARD_MANAGER
      emp.managerId = null
    } else if (isManagerTitle(emp.title)) {
      assignManager(emp, apex)
    } else {
      const manager = pickManagerFor(employees, emp.department, emp.id)
      assignManager(emp, manager)
    }
  }

  // Safety pass: fix any remaining gaps or self-reports
  for (const emp of employees) {
    if (!emp.manager || emp.managerId === emp.id) {
      const manager = pickManagerFor(employees, emp.department, emp.id)
      if (manager.id === emp.id) {
        emp.manager = BOARD_MANAGER
        emp.managerId = null
      } else {
        assignManager(emp, manager)
      }
    }
  }
}

// Build a manager pool first (10 senior managers), then assign reports to them
function generateEmployees(count = 100) {
  const employees = []

  // Step 1: create 10 senior managers (no manager themselves, "leadership")
  const managerSeedTitles = [
    { title: 'VP of Engineering', dept: 'Engineering' },
    { title: 'VP of Sales', dept: 'Sales' },
    { title: 'Director of Customer Success', dept: 'Customer Support' },
    { title: 'VP of Finance', dept: 'Finance' },
    { title: 'VP of People', dept: 'People' },
    { title: 'VP of Marketing', dept: 'Marketing' },
    { title: 'VP of Product', dept: 'Product' },
    { title: 'COO', dept: 'Operations' },
    { title: 'General Counsel', dept: 'Legal' },
    { title: 'Director of IT', dept: 'IT' },
  ]

  for (let i = 0; i < managerSeedTitles.length; i++) {
    const fn = pick(firstNames)
    const ln = pick(lastNames)
    const { title, dept } = managerSeedTitles[i]
    employees.push({
      id: `emp-${i + 1}`,
      profileNumber: i + 1,
      firstName: fn,
      lastName: ln,
      fullName: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@acme.com`,
      title,
      department: dept,
      manager: null,
      managerId: null,
      location: pick(locations).name,
      employmentType: 'Full-time',
      status: 'Active',
      startDate: '2021-03-15',
    })
  }

  // Step 2: create the rest, assigning a manager from existing pool when one fits dept
  for (let i = managerSeedTitles.length; i < count; i++) {
    const fn = pick(firstNames)
    const ln = pick(lastNames)
    const dept = pick(departments)
    const title = pick(titlesByDept[dept])

    const manager = pickManagerFor(employees, dept, null)

    const yearStart = 2019 + randInt(6)
    const monthStart = 1 + randInt(12)
    const dayStart = 1 + randInt(28)

    employees.push({
      id: `emp-${i + 1}`,
      profileNumber: i + 1,
      firstName: fn,
      lastName: ln,
      fullName: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@acme.com`,
      title,
      department: dept,
      manager: manager.fullName,
      managerId: manager.id,
      location: pick(locations).name,
      employmentType: pick(employmentTypes),
      status: pick(statuses),
      startDate: `${yearStart}-${String(monthStart).padStart(2, '0')}-${String(dayStart).padStart(2, '0')}`,
    })
  }

  ensureEveryoneHasManager(employees)
  return employees
}

export const EMPLOYEES = generateEmployees(100)

export const PEOPLE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'employees', label: 'Employees' },
  { id: 'contractors', label: 'Contractors' },
  { id: 'onboarding', label: 'Onboarding' },
]

/** Tab segments for the People list (mutually exclusive). */
export function matchesPeopleTab(emp, tabId) {
  switch (tabId) {
    case 'employees':
      return emp.employmentType !== 'Contractor' && emp.status !== 'Onboarding'
    case 'contractors':
      return emp.employmentType === 'Contractor'
    case 'onboarding':
      return emp.status === 'Onboarding'
    case 'all':
    default:
      return true
  }
}

export const DEPARTMENTS = departments
export const LOCATIONS = locations.map((l) => l.name)
export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contractor']
export const STATUSES = ['Active', 'On Leave', 'Onboarding']

// Unique managers list (for filter dropdown)
export const MANAGERS = [...new Set(EMPLOYEES.map((e) => e.manager).filter(Boolean))].sort()
