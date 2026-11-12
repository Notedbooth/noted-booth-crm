import { describe, expect, it } from "vitest";
import { conversionRate, isOverdue, isUpcoming, salesTotal } from "@/lib/metrics";
import { can } from "@/lib/permissions";

describe("conversion rate", () => {
  it("counts confirmed, in execution and completed leads as won", () => {
    const leads = [
      { stage: "confirmed" as const, created_at: "2026-01-02T00:00:00Z" },
      { stage: "in_execution" as const, created_at: "2026-01-02T00:00:00Z" },
      { stage: "completed" as const, created_at: "2026-01-02T00:00:00Z" },
      { stage: "lost" as const, created_at: "2026-01-02T00:00:00Z" },
    ];
    expect(conversionRate(leads)).toBe(75);
  });
});

describe("sales total", () => {
  it("excludes cancelled bookings", () => {
    const bookings = [
      { status: "confirmed" as const, event_date: "2026-01-10", total_value: 1500 },
      { status: "cancelled" as const, event_date: "2026-01-11", total_value: 900 },
      { status: "completed" as const, event_date: "2026-01-12", total_value: 500 },
    ];
    expect(salesTotal(bookings)).toBe(2000);
  });
});

describe("follow-ups and events", () => {
  const now = new Date("2026-03-10T12:00:00Z");
  it("marks an open task past its due date as overdue", () => {
    expect(isOverdue({ status: "open", due_date: "2026-03-09T10:00:00Z" }, now)).toBe(true);
  });
  it("never marks a done task as overdue", () => {
    expect(isOverdue({ status: "done", due_date: "2026-03-01T10:00:00Z" }, now)).toBe(false);
  });
  it("does not count cancelled bookings as upcoming", () => {
    expect(isUpcoming({ status: "cancelled", event_date: "2026-04-01", total_value: 0 }, now)).toBe(false);
  });
});

describe("permissions", () => {
  it("only admins manage the team", () => {
    expect(can(["admin"], "team.manage")).toBe(true);
    expect(can(["manager"], "team.manage")).toBe(false);
  });
  it("sales cannot delete records or view reports", () => {
    expect(can(["sales"], "records.delete")).toBe(false);
    expect(can(["sales"], "reports.view")).toBe(false);
  });
  it("operations cannot edit customers", () => {
    expect(can(["operations"], "customers.write")).toBe(false);
  });
});
