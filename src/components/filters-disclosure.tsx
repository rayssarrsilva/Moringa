'use client';

import { useId, useState, type ReactNode } from 'react';

/**
 * On small screens the filters start folded behind a button; from `lg` up they are always open.
 * The form inside is server-rendered and submits with GET, so filtering itself needs no JavaScript.
 */
export function FiltersDisclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="text-label flex min-h-12 w-full items-center justify-between rounded-md border-[1.5px] border-border-control px-4 lg:hidden"
      >
        {label}
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={open ? 'rotate-180' : ''}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div id={id} className={`${open ? 'block' : 'hidden'} pt-4 lg:block lg:pt-0`}>
        {children}
      </div>
    </div>
  );
}
