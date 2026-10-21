export const selectClass =
  'min-h-11 w-full rounded-md border-[1.5px] border-border-control bg-bg-canvas px-3 aria-[invalid=true]:border-feedback-danger';

/** The visible order of fields, so errors focus the first one people see. */
export function firstInvalid<T extends string>(
  order: readonly T[],
  errors: Partial<Record<T, unknown>>,
) {
  return order.find((name) => errors[name]);
}
