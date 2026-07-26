/** Metode penyusutan (SDD §5.4.1). STRAIGHT_LINE default; sisanya future. */
export enum DepreciationMethod {
  STRAIGHT_LINE = 'STRAIGHT_LINE',
  DECLINING_BALANCE = 'DECLINING_BALANCE',
  UNITS_OF_PRODUCTION = 'UNITS_OF_PRODUCTION',
}
