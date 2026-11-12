import type { AppRole } from "./constants";

export type Capability =
  | "customers.write"
  | "leads.write"
  | "bookings.write"
  | "tasks.write"
  | "records.delete"
  | "packages.manage"
  | "requests.view"
  | "reports.view"
  | "activity.view"
  | "team.manage";

const MATRIX: Record<AppRole, Capability[]> = {
  admin: [
    "customers.write",
    "leads.write",
    "bookings.write",
    "tasks.write",
    "records.delete",
    "packages.manage",
    "requests.view",
    "reports.view",
    "activity.view",
    "team.manage",
  ],
  manager: [
    "customers.write",
    "leads.write",
    "bookings.write",
    "tasks.write",
    "records.delete",
    "packages.manage",
    "requests.view",
    "reports.view",
    "activity.view",
  ],
  sales: ["customers.write", "leads.write", "bookings.write", "tasks.write", "requests.view"],
  operations: ["bookings.write", "tasks.write"],
};

export function can(roles: AppRole[] | undefined | null, capability: Capability): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.some((r) => MATRIX[r]?.includes(capability));
}

export function primaryRole(roles: AppRole[] | undefined | null): AppRole | null {
  if (!roles || roles.length === 0) return null;
  const order: AppRole[] = ["admin", "manager", "sales", "operations"];
  return order.find((r) => roles.includes(r)) ?? null;
}
