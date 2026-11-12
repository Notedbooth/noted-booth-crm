import { endOfDay, isBefore, isWithinInterval, parseISO, startOfDay } from "date-fns";
import { WON_STAGES, type BookingStatus, type LeadStage, type TaskStatus } from "./constants";

type LeadLike = { stage: LeadStage; created_at: string };
type BookingLike = { status: BookingStatus; event_date: string; total_value: number | null };
type TaskLike = { status: TaskStatus; due_date: string | null };

export type Range = { from: Date; to: Date };

export function inRange(iso: string | null | undefined, range?: Range) {
  if (!iso) return false;
  if (!range) return true;
  return isWithinInterval(parseISO(iso), { start: startOfDay(range.from), end: endOfDay(range.to) });
}

/** Share of leads (created in range) that reached a won stage: confirmed, in execution, or completed. */
export function conversionRate(leads: LeadLike[], range?: Range): number {
  const scoped = leads.filter((l) => inRange(l.created_at, range));
  if (scoped.length === 0) return 0;
  const won = scoped.filter((l) => WON_STAGES.includes(l.stage)).length;
  return Math.round((won / scoped.length) * 1000) / 10;
}

/** Sales = total value of non-cancelled bookings whose event date falls in range. */
export function salesTotal(bookings: BookingLike[], range?: Range): number {
  return bookings
    .filter((b) => b.status !== "cancelled" && inRange(b.event_date, range))
    .reduce((sum, b) => sum + Number(b.total_value ?? 0), 0);
}

/** Open or in-progress tasks whose due date has passed. */
export function isOverdue(task: TaskLike, now = new Date()): boolean {
  if (task.status === "done" || task.status === "cancelled" || !task.due_date) return false;
  return isBefore(parseISO(task.due_date), now);
}

/** Upcoming bookings: event date today or later, not cancelled or completed. */
export function isUpcoming(b: BookingLike, now = new Date()): boolean {
  if (b.status === "cancelled" || b.status === "completed") return false;
  return !isBefore(parseISO(b.event_date), startOfDay(now));
}
