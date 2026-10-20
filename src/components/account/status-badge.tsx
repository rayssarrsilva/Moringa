'use client';

import { useTranslations } from 'next-intl';
import { Badge, type BadgeTone } from '@rayssarrsilva/ipe';
import type { OrderStatus } from '@/lib/order-status';

const tones: Record<OrderStatus, BadgeTone> = {
  pending: 'accent',
  paid: 'info',
  preparing: 'info',
  shipped: 'accent',
  delivered: 'success',
  canceled: 'neutral',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations('OrderStatus');
  return (
    <Badge dot tone={tones[status]}>
      {t(status)}
    </Badge>
  );
}
