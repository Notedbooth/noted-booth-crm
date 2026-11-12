import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { arSA } from "date-fns/locale";
import { CURRENCY_LABEL } from "./constants";

const nf = new Intl.NumberFormat("ar-SA-u-nu-latn", { maximumFractionDigits: 0 });

export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? d : null;
}

export function fmtDate(value: string | Date | null | undefined, pattern = "d MMM yyyy") {
  const d = toDate(value);
  return d ? format(d, pattern, { locale: arSA }) : "—";
}

export function fmtDateTime(value: string | Date | null | undefined) {
  return fmtDate(value, "d MMM yyyy، h:mm a");
}

export function fmtRelative(value: string | Date | null | undefined) {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true, locale: arSA }) : "—";
}

export function fmtNumber(n: number | null | undefined) {
  return nf.format(n ?? 0);
}

export function fmtMoney(n: number | string | null | undefined) {
  if (n === null || n === undefined || n === "") return "—";
  return `${nf.format(Number(n))} ${CURRENCY_LABEL}`;
}

export function fmtTime(value: string | null | undefined) {
  if (!value) return "";
  const [h, m] = value.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "م" : "ص";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${suffix}`;
}

/** Converts empty strings to null so optional columns are stored cleanly. */
export function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" || v === undefined ? null : v;
  return out as T;
}

export function initials(name: string | null | undefined) {
  if (!name) return "؟";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}
