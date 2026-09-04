import { nightsBetween, isValidRange, rangesOverlap, daysUntil } from './dates';

describe('dates utils', () => {
  describe('nightsBetween', () => {
    it('calcula noches con checkOut exclusivo', () => {
      expect(nightsBetween('2026-10-01', '2026-10-04')).toBe(3);
    });

    it('una noche para días consecutivos', () => {
      expect(nightsBetween('2026-10-01', '2026-10-02')).toBe(1);
    });

    it('cruza cambio de mes y de año', () => {
      expect(nightsBetween('2026-01-30', '2026-02-02')).toBe(3);
      expect(nightsBetween('2026-12-31', '2027-01-02')).toBe(2);
    });
  });

  describe('isValidRange', () => {
    it('acepta checkOut posterior', () => {
      expect(isValidRange('2026-10-01', '2026-10-02')).toBe(true);
    });

    it('rechaza rango invertido, igual o fechas inválidas', () => {
      expect(isValidRange('2026-10-02', '2026-10-01')).toBe(false);
      expect(isValidRange('2026-10-01', '2026-10-01')).toBe(false);
      expect(isValidRange('no-fecha', '2026-10-02')).toBe(false);
    });
  });

  describe('rangesOverlap', () => {
    it('detecta solape parcial y contenido', () => {
      expect(
        rangesOverlap('2026-10-01', '2026-10-05', '2026-10-03', '2026-10-07'),
      ).toBe(true);
      expect(
        rangesOverlap('2026-10-01', '2026-10-10', '2026-10-03', '2026-10-05'),
      ).toBe(true);
    });

    it('check-out el mismo día del check-in ajeno NO solapa', () => {
      expect(
        rangesOverlap('2026-10-01', '2026-10-03', '2026-10-03', '2026-10-05'),
      ).toBe(false);
      expect(
        rangesOverlap('2026-10-05', '2026-10-07', '2026-10-01', '2026-10-05'),
      ).toBe(false);
    });
  });

  describe('daysUntil', () => {
    it('retorna entero coherente con hoy', () => {
      const in7 = new Date(Date.now() + 7 * 86400000)
        .toISOString()
        .slice(0, 10);
      expect(daysUntil(in7)).toBeGreaterThanOrEqual(6);
      expect(daysUntil(in7)).toBeLessThanOrEqual(7);
    });
  });
});
