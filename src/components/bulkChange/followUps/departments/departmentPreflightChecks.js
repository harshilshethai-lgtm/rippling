/**
 * Dummy automated pre-flight checks per department, optionally augmented by
 * the triggering field. These are the Zone 1 probes that run on entry to a
 * department panel ("steps that run before we arrive on the platform-level
 * or user-workflow-level third-person dependency").
 *
 * Each check has the same shape as the existing System Checks items so the
 * existing ChecklistItem visual treatment can be reused 1:1:
 *
 *   { id, label, sublabel, kind: 'probe', outcome: 'success'|'warning'|'failure' }
 *
 * `outcome` lets the demo author hard-code which checks fire warnings/failures
 * for a stable, repeatable narrative. The runner stages them with the existing
 * spinner animation pattern.
 */

const DEFAULT_CHECKS = {
  hr: [
    { id: 'hr.recordIntegrity',  label: 'HRIS record integrity',                       sublabel: 'Verifies the employee record is consistent across HR modules',          outcome: 'success' },
    { id: 'hr.addressValidator', label: 'Address validation service reachable',        sublabel: 'Confirms the geocoder is accepting requests',                          outcome: 'success' },
  ],
  payroll: [
    { id: 'pay.lockWindow',      label: 'Payroll lock window is open',                 sublabel: 'No payroll run is currently in a locked period',                       outcome: 'success' },
    { id: 'pay.fxCached',        label: 'Currency FX rate cached',                     sublabel: 'Most-recent rate available for the relevant currencies',               outcome: 'success' },
  ],
  it: [
    { id: 'it.idpReachable',     label: 'Identity provider reachable',                 sublabel: 'Okta is accepting provisioning requests',                              outcome: 'success' },
    { id: 'it.policyEngine',     label: 'Policy engine warmed up',                     sublabel: 'Access policy evaluation service is responsive',                       outcome: 'success' },
  ],
  finance: [
    { id: 'fin.gledger',         label: 'General ledger reachable',                    sublabel: 'NetSuite responding within SLA',                                       outcome: 'success' },
    { id: 'fin.equityTax',       label: 'Equity tax tables loaded',                    sublabel: 'Current-year tables available for affected jurisdictions',             outcome: 'success' },
  ],
  global: [
    { id: 'global.taxEngine',    label: 'Tax engine responsive',                       sublabel: 'Avalara is returning quotes within SLA',                               outcome: 'success' },
    { id: 'global.entityCatalog',label: 'Legal entity catalog up to date',             sublabel: 'Latest entity sync completed in the last 24h',                         outcome: 'success' },
  ],
  benefits: [
    { id: 'ben.eligibility',     label: 'Benefits eligibility engine reachable',        sublabel: 'Rippling Benefits engine responding',                                  outcome: 'success' },
    { id: 'ben.carrierFeed',     label: 'Carrier feed last sync recent',                sublabel: 'Last 834 feed succeeded within the past 24h',                          outcome: 'success' },
  ],
  compliance: [
    { id: 'comp.trainingCatalog', label: 'Training catalog reachable',                  sublabel: 'Learning content service responding',                                  outcome: 'success' },
    { id: 'comp.policyService',   label: 'Compliance policy service reachable',          sublabel: 'Regulatory policy database responding',                                outcome: 'success' },
  ],
}

/**
 * Field-specific check augmentations. These are appended (de-duped by id) to
 * the DEFAULT_CHECKS for the department when the listed field is also part of
 * the selection. They're how we surface narrative details like "DE doesn't
 * yet have an HRBP" for the canonical region-change demo.
 */
const FIELD_AUGMENTS = {
  workLocation: {
    hr: [
      { id: 'hr.hrbpAssigned',   label: 'Regional HRBP assigned',                       sublabel: 'A primary HR Business Partner is on file for the target country',     outcome: 'warning' },
    ],
    payroll: [
      { id: 'pay.openDrafts',    label: 'No open paycheck drafts for affected employees', sublabel: 'Drafts in flight would need to be re-cut after the move',           outcome: 'warning' },
    ],
    it: [
      { id: 'it.countryAllowed', label: 'Country in IdP allow-list policy',             sublabel: 'New country is permitted by current identity policy',                  outcome: 'success' },
      { id: 'it.vpnCapacity',    label: 'Regional VPN endpoint capacity',                sublabel: 'Spare capacity available on the nearest VPN concentrator',             outcome: 'warning' },
    ],
    finance: [
      { id: 'fin.spendCats',     label: 'Spend categories exist in target currency',     sublabel: 'Expense categories mapped to the new currency',                        outcome: 'success' },
    ],
    global: [
      { id: 'global.countrySupported', label: 'Tax engine supports the target country',  sublabel: 'Avalara content available for the target country',                     outcome: 'success' },
      { id: 'global.legalEntityExists', label: 'Legal entity exists in target country',   sublabel: 'Verified registered entity available for hire',                        outcome: 'success' },
    ],
    benefits: [
      { id: 'ben.carrierMap',    label: 'Carrier coverage map includes target country',  sublabel: 'A carrier with country coverage is configured',                        outcome: 'warning' },
    ],
    compliance: [
      { id: 'comp.countryCatalog', label: 'Country-specific training catalog available', sublabel: 'Required training modules exist for the target country',               outcome: 'success' },
    ],
  },
  currency: {
    payroll: [
      { id: 'pay.fxCachedTarget',  label: 'FX rate cached for the target currency',     sublabel: 'A recent quote is available for next paycheck calculation',            outcome: 'success' },
    ],
    finance: [
      { id: 'fin.gledgerCurrency', label: 'GL supports the target currency',            sublabel: 'Currency configured in the chart of accounts',                          outcome: 'success' },
    ],
  },
  employmentType: {
    benefits: [
      { id: 'ben.cobraReady',      label: 'COBRA service responsive',                   sublabel: 'Required for any plan downgrades triggered by the change',             outcome: 'success' },
    ],
    compliance: [
      { id: 'comp.classCatalog',   label: 'Classification-specific training catalog',    sublabel: 'Modules exist for the new worker type',                                outcome: 'success' },
    ],
  },
  visaStatus: {
    global: [
      { id: 'global.visaCheck',    label: 'Visa class permits work in current country',  sublabel: 'Verified the new visa permits employment in the work country',          outcome: 'success' },
    ],
  },
  legalEntity: {
    global: [
      { id: 'global.entityPayrollReg', label: 'Receiving entity registered for payroll', sublabel: 'Verified the entity is payroll-registered in the country',             outcome: 'success' },
    ],
  },
}

/**
 * Build the full ordered list of pre-flight checks for a department, given
 * which fields are in the current selection. De-duplicates by `id`.
 *
 * Always returns at least the DEFAULT_CHECKS for the department so Zone 1
 * is never empty for an active department.
 */
export function getPreflightChecks(deptId, selectedFieldKeys) {
  const base = DEFAULT_CHECKS[deptId] ?? []
  const seen = new Set(base.map((c) => c.id))
  const out = [...base]
  for (const fk of selectedFieldKeys ?? []) {
    const aug = FIELD_AUGMENTS[fk]?.[deptId]
    if (!aug) continue
    for (const check of aug) {
      if (seen.has(check.id)) continue
      seen.add(check.id)
      out.push(check)
    }
  }
  return out
}
