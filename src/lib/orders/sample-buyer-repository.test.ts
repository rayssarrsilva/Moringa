import { describe, expect, it } from 'vitest';
import { demoBuyer } from './sample-orders';
import { sampleBuyerRepository as repo } from './sample-buyer-repository';

const marina = (sid = 'session-a') => ({ email: demoBuyer.email, sid });

describe('sample buyer orders', () => {
  it('lists Marina orders and nothing for anyone else', async () => {
    expect(await repo.listForBuyer(marina())).toHaveLength(3);
    expect(await repo.listForBuyer({ email: 'outra@exemplo.com', sid: 'x' })).toEqual([]);
  });

  it('prices orders from the catalog, with one shipping per maker', async () => {
    const order = await repo.getForBuyer(marina(), 'MOR-4MWD8C');
    expect(order).toMatchObject({
      subtotalCents: 2 * 6500,
      shippingCents: 1500,
      totalCents: 14500,
    });
  });

  it('lets the buyer confirm a shipped order, once', async () => {
    const viewer = marina('session-confirm');
    const result = await repo.confirmDelivery(viewer, 'MOR-7KQ2XA');
    expect(result.ok && result.order.status).toBe('delivered');
    expect(await repo.confirmDelivery(viewer, 'MOR-7KQ2XA')).toEqual({
      ok: false,
      reason: 'not_allowed',
    });
  });

  it('does not let the buyer skip steps or touch unknown orders', async () => {
    expect(await repo.confirmDelivery(marina(), 'MOR-H3P9TZ')).toEqual({
      ok: false,
      reason: 'not_allowed',
    });
    expect(await repo.confirmDelivery(marina(), 'MOR-NADA00')).toEqual({
      ok: false,
      reason: 'not_found',
    });
  });

  it('keeps demo changes per session', async () => {
    await repo.confirmDelivery(marina('session-b'), 'MOR-7KQ2XA');
    expect((await repo.getForBuyer(marina('session-c'), 'MOR-7KQ2XA'))!.status).toBe('shipped');
  });
});
