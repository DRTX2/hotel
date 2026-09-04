const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Noches entre check-in (inclusivo) y check-out (exclusivo),
 * calculadas en días calendario UTC. Las fechas de reserva
 * son `YYYY-MM-DD`, sin hora: la comparación lexicográfica
 * equivale a la cronológica.
 */
export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / MS_PER_DAY);
}

export function isValidRange(checkIn: string, checkOut: string): boolean {
  return (
    !Number.isNaN(Date.parse(checkIn)) &&
    !Number.isNaN(Date.parse(checkOut)) &&
    checkOut > checkIn
  );
}

/** Solape de rangos [inicio, fin): A.start < B.end && B.start < A.end */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Días calendario completos desde hoy (UTC) hasta la fecha dada. */
export function daysUntil(date: string): number {
  const today = new Date().toISOString().slice(0, 10);
  return Math.round((Date.parse(date) - Date.parse(today)) / MS_PER_DAY);
}
