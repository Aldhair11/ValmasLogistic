export const MASTER_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const MASTER_DEFAULT_PAGE_SIZE = 10;

export type CourierAvailabilityFilter = 'all' | 'available' | 'unavailable';

export function toAvailabilityParam(
  filter: CourierAvailabilityFilter,
): boolean | undefined {
  if (filter === 'available') return true;
  if (filter === 'unavailable') return false;
  return undefined;
}
