/**
 * Static automated tasks per department.
 *
 * These execute automatically on commit — no human action or acknowledgment
 * required. Shown in the Department Panel as an informational list so the
 * domain owner knows what the platform will handle on their behalf.
 */

const AUTO_TASKS_BY_DEPT = {
  hr: [
    {
      id: 'auto.hr.recordSync',
      title: 'HRIS record sync',
      description: 'All employee record fields automatically updated across HR modules on effective date.',
    },
    {
      id: 'auto.hr.orgChart',
      title: 'Org chart refresh',
      description: 'Reporting hierarchy automatically updated in org visualization and all connected tools.',
    },
  ],
  payroll: [
    {
      id: 'auto.pay.taxJurisdiction',
      title: 'Tax jurisdiction recalculation',
      description: 'Tax withholding rates automatically recalculated for all affected employees.',
    },
    {
      id: 'auto.pay.entityReassign',
      title: 'Payroll entity reassignment',
      description: 'Employees automatically routed to the correct payroll entity on effective date.',
    },
  ],
  it: [
    {
      id: 'auto.it.idpGroupSync',
      title: 'IdP group membership sync',
      description: 'Okta groups automatically updated based on new org structure and role assignments.',
    },
    {
      id: 'auto.it.accessPolicyPropagation',
      title: 'Access policy propagation',
      description: 'Device and app access policies automatically re-evaluated and pushed to connected systems.',
    },
  ],
  finance: [
    {
      id: 'auto.fin.costCenterUpdate',
      title: 'GL cost center update',
      description: 'General ledger cost center codes automatically updated across expense and billing systems.',
    },
    {
      id: 'auto.fin.budgetSync',
      title: 'Budget allocation sync',
      description: 'Headcount costs automatically reallocated to reflect updated department budgets.',
    },
  ],
  global: [
    {
      id: 'auto.global.taxEngineRouting',
      title: 'Tax engine routing update',
      description: 'Tax engine automatically updated with new jurisdiction and entity mappings.',
    },
    {
      id: 'auto.global.entityCatalogSync',
      title: 'Legal entity catalog sync',
      description: 'Entity assignments automatically propagated to connected global payroll systems.',
    },
  ],
  benefits: [
    {
      id: 'auto.ben.eligibilityRecalc',
      title: 'Eligibility engine recalculation',
      description: 'Benefits eligibility rules automatically re-evaluated based on updated employment data.',
    },
    {
      id: 'auto.ben.carrierFeedUpdate',
      title: 'Carrier data feed update',
      description: 'Updated enrollment data automatically sent to carriers via 834 EDI feed.',
    },
  ],
  compliance: [
    {
      id: 'auto.comp.trainingRecalc',
      title: 'Training catalog re-evaluation',
      description: 'Required training assignments automatically recalculated for new role and location.',
    },
    {
      id: 'auto.comp.policyCheck',
      title: 'Policy compliance flag check',
      description: 'Regulatory policy flags automatically re-run against updated employee records.',
    },
  ],
}

export function getAutoTasksForDept(deptId) {
  return AUTO_TASKS_BY_DEPT[deptId] ?? []
}
