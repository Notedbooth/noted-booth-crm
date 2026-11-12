import { ACTION_LABELS, BOOKING_STATUS_LABELS, ENTITY_LABELS, FIELD_LABELS, LEAD_STAGE_LABELS, TASK_STATUS_LABELS } from "@/lib/constants";
import { fmtDateTime, fmtRelative, initials } from "@/lib/format";
import type { ActivityWithActor } from "@/lib/data";

function valueLabel(entity: string, field: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  const s = String(v);
  if (field === "stage") return LEAD_STAGE_LABELS[s as keyof typeof LEAD_STAGE_LABELS] ?? s;
  if (field === "status" && entity === "bookings") return BOOKING_STATUS_LABELS[s as keyof typeof BOOKING_STATUS_LABELS] ?? s;
  if (field === "status" && entity === "tasks") return TASK_STATUS_LABELS[s as keyof typeof TASK_STATUS_LABELS] ?? s;
  if (field.endsWith("_id") || field === "assigned_to") return "تم التغيير";
  if (typeof v === "boolean") return v ? "نعم" : "لا";
  return s.length > 60 ? s.slice(0, 60) + "…" : s;
}

export function describeChanges(a: ActivityWithActor) {
  const changes = (a.changes ?? {}) as Record<string, { from: unknown; to: unknown }>;
  return Object.entries(changes).map(([field, c]) => ({
    field: FIELD_LABELS[field] ?? field,
    from: valueLabel(a.entity_type, field, c.from),
    to: valueLabel(a.entity_type, field, c.to),
  }));
}

export function ActivityFeed({ items, compact }: { items: ActivityWithActor[]; compact?: boolean }) {
  if (!items.length) return <p className="py-6 text-center text-sm text-muted-foreground">لا يوجد نشاط بعد</p>;
  return (
    <ol className="relative space-y-4 border-s ps-5">
      {items.map((a) => {
        const changes = describeChanges(a);
        const actor = a.actor?.full_name ?? "النظام";
        return (
          <li key={a.id} className="relative">
            <span className="absolute -start-[29px] top-0.5 grid size-6 place-items-center rounded-full border bg-card text-[10px] font-semibold text-primary">
              {initials(actor)}
            </span>
            <div className="text-sm">
              <span className="font-semibold">{actor}</span> {ACTION_LABELS[a.action] ?? a.action}{" "}
              {ENTITY_LABELS[a.entity_type] ?? a.entity_type}
              {a.entity_label && <span className="font-medium"> «{a.entity_label}»</span>}
            </div>
            {!compact && changes.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                {changes.slice(0, 6).map((c) => (
                  <li key={c.field}>
                    {c.field}: <span className="line-through opacity-70">{c.from}</span> ← <span className="text-foreground">{c.to}</span>
                  </li>
                ))}
              </ul>
            )}
            {compact && a.action === "status_changed" && changes[0] && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                {changes[0].from} ← {changes[0].to}
              </div>
            )}
            <div className="mt-0.5 text-[11px] text-muted-foreground" title={fmtDateTime(a.created_at)}>
              {fmtRelative(a.created_at)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
