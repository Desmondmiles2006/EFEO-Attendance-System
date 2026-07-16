// Annual quotas per quota group, in days. Enforced as "track + warn" (never blocks submission).
export const ANNUAL_QUOTAS: Record<string, number> = {
  CL: 12,
  MEDICAL: 15,
  SPECIAL: 3,
};
