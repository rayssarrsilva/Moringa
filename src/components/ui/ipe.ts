'use client';

/**
 * Ipê components use React context (Radix primitives), so they must run on the client.
 * Ipê 1.0 does not ship a "use client" directive yet, so this module marks the boundary
 * and Server Components import Ipê from here.
 */
export * from '@rayssarrsilva/ipe';
