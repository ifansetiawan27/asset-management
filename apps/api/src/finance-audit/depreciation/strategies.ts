import { DepreciationMethod } from '../../asset-catalog/enums/depreciation-method.enum';

export interface DepreciationInput {
  purchasePrice: number;
  salvageValue: number;
  usefulLifeYears: number;
}

export interface DepreciationStrategy {
  readonly method: DepreciationMethod;
  monthlyAmount(input: DepreciationInput): number;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Straight Line (default): (harga − nilai sisa) / (umur × 12). SDD §8.2. */
export class StraightLineStrategy implements DepreciationStrategy {
  readonly method = DepreciationMethod.STRAIGHT_LINE;

  monthlyAmount(input: DepreciationInput): number {
    const base = Math.max(input.purchasePrice - input.salvageValue, 0);
    const months = input.usefulLifeYears * 12;
    if (months <= 0) {
      return 0;
    }
    return round2(base / months);
  }
}

const STRATEGIES: DepreciationStrategy[] = [new StraightLineStrategy()];

/** Memilih strategy berdasar metode; fallback ke Straight Line (metode lain future). */
export function resolveStrategy(method: string): DepreciationStrategy {
  return STRATEGIES.find((strategy) => strategy.method === method) ?? STRATEGIES[0];
}
