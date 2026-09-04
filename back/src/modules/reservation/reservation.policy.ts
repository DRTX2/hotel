/**
 * Política de cancelación por antelación (días calendario hasta el check-in):
 * - ≥ 7 días → 100% reembolso
 * - 2–6 días → 50% reembolso
 * - < 2 días o check-in pasado → 0%
 */
export function refundPercentFor(daysUntilCheckIn: number): number {
  if (daysUntilCheckIn >= 7) return 100;
  if (daysUntilCheckIn >= 2) return 50;
  return 0;
}
