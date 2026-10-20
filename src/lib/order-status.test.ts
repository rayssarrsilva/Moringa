import { describe, expect, it } from 'vitest';
import { canTransition, isFinal, normalizeTrackingCode, trackingCodePattern } from './order-status';

describe('order lifecycle', () => {
  it('follows the happy path with the right actor at each step', () => {
    expect(canTransition('pending', 'paid', 'system')).toBe(true);
    expect(canTransition('paid', 'preparing', 'seller')).toBe(true);
    expect(canTransition('preparing', 'shipped', 'seller')).toBe(true);
    expect(canTransition('shipped', 'delivered', 'buyer')).toBe(true);
  });

  it('does not let a buyer mark an order as paid or shipped', () => {
    expect(canTransition('pending', 'paid', 'buyer')).toBe(false);
    expect(canTransition('preparing', 'shipped', 'buyer')).toBe(false);
  });

  it('does not skip steps', () => {
    expect(canTransition('paid', 'shipped', 'seller')).toBe(false);
    expect(canTransition('pending', 'delivered', 'system')).toBe(false);
  });

  it('only allows cancelling before the order is prepared', () => {
    expect(canTransition('paid', 'canceled', 'seller')).toBe(true);
    expect(canTransition('shipped', 'canceled', 'seller')).toBe(false);
  });

  it('treats delivered and canceled as final', () => {
    expect(isFinal('delivered')).toBe(true);
    expect(isFinal('canceled')).toBe(true);
    expect(isFinal('shipped')).toBe(false);
  });
});

describe('tracking codes', () => {
  it('accepts Correios codes after normalizing spaces and case', () => {
    expect(trackingCodePattern.test(normalizeTrackingCode(' br 123456789 br '))).toBe(true);
  });

  it('rejects codes with the wrong shape', () => {
    for (const code of ['BR12345678BR', '123456789BR', 'BR123456789B1', '']) {
      expect(trackingCodePattern.test(normalizeTrackingCode(code))).toBe(false);
    }
  });
});
