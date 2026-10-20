import { describe, expect, it } from 'vitest';
import { buildTimeline, isOpen } from './timeline';

const base = { paidAt: null, preparingAt: null, shippedAt: null, deliveredAt: null };

describe('buildTimeline', () => {
  it('marks earlier steps done, the latest current and later ones upcoming', () => {
    const timeline = buildTimeline({
      ...base,
      status: 'shipped',
      paidAt: '2026-10-01T12:00:00Z',
      preparingAt: '2026-10-02T12:00:00Z',
      shippedAt: '2026-10-03T12:00:00Z',
    });
    expect(timeline.map((t) => t.state)).toEqual(['done', 'done', 'current', 'upcoming']);
    expect(timeline[2]!.at).toBe('2026-10-03T12:00:00Z');
    expect(timeline[3]!.at).toBeNull();
  });

  it('shows every step done once delivered', () => {
    const timeline = buildTimeline({
      ...base,
      status: 'delivered',
      deliveredAt: '2026-10-05T12:00:00Z',
    });
    expect(timeline.every((t) => t.state === 'done')).toBe(true);
  });

  it('shows nothing reached while the payment is pending', () => {
    expect(buildTimeline({ ...base, status: 'pending' }).every((t) => t.state === 'upcoming')).toBe(
      true,
    );
  });
});

describe('isOpen', () => {
  it('keeps polling only orders that can still change', () => {
    expect(isOpen('shipped')).toBe(true);
    expect(isOpen('pending')).toBe(true);
    expect(isOpen('delivered')).toBe(false);
    expect(isOpen('canceled')).toBe(false);
  });
});
