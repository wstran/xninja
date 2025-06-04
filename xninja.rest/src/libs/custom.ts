import Decimal from 'decimal.js';

export function roundDown(value: number, decimals: number) {
  return new Decimal(value).toFixed(decimals, Decimal.ROUND_DOWN);
};