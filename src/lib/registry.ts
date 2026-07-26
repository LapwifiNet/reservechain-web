/**
 * Illustrative registry rows for the public asset registry (wireframe #3).
 *
 * Deliberately carries identifiers and status only. Purity, weight, valuation
 * and reserve figures are owner-supplied and unverified, so they are rendered
 * as "pending" states rather than placeholder numbers (CR-5: never substitute
 * fabricated values for missing data).
 */
export type RegistryUnit = {
  id: string;
  program: 'copper' | 'nickel';
  unitKey: 'container' | 'coil';
};

export const registryUnits: RegistryUnit[] = [
  { id: 'DAP-0001', program: 'copper', unitKey: 'container' },
  { id: 'DAP-0002', program: 'copper', unitKey: 'container' },
  { id: 'DAP-0003', program: 'copper', unitKey: 'container' },
  { id: 'DAP-0004', program: 'nickel', unitKey: 'coil' },
  { id: 'DAP-0005', program: 'nickel', unitKey: 'coil' },
  { id: 'DAP-0006', program: 'nickel', unitKey: 'coil' },
];
