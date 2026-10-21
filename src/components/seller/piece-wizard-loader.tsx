'use client';

import dynamic from 'next/dynamic';

/** The wizard reads its draft from localStorage, so it only renders in the browser. */
export const PieceWizardLoader = dynamic(
  () => import('./piece-wizard').then((m) => m.PieceWizard),
  {
    ssr: false,
    loading: () => <div className="min-h-96" aria-hidden="true" />,
  },
);
