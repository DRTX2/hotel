import { refundPercentFor } from './reservation.policy';

describe('reservation.policy', () => {
  it('reembolsa 100% con ≥ 7 días de antelación', () => {
    expect(refundPercentFor(7)).toBe(100);
    expect(refundPercentFor(30)).toBe(100);
  });

  it('reembolsa 50% entre 2 y 6 días', () => {
    expect(refundPercentFor(6)).toBe(50);
    expect(refundPercentFor(2)).toBe(50);
  });

  it('no reembolsa con < 2 días o check-in pasado', () => {
    expect(refundPercentFor(1)).toBe(0);
    expect(refundPercentFor(0)).toBe(0);
    expect(refundPercentFor(-3)).toBe(0);
  });
});
