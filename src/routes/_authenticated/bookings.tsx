import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, Clock, MapPin, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader } from "@/components/crm/page-header";
import { BookingStatusBadge } from "@/components/crm/badges";
import { BookingFormDialog } from "@/components/crm/booking-form";
import { ConfirmDelete } from "@/components/crm/confirm-delete";
import { OptionSelect } from "@/components/crm/fields";
import { useMe } from "@/components/crm/me-context";
import { bookingsQuery, useDeleteRecord, type Booking } from "@/lib/data";
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS } from "@/lib/constants";
import { isUpcoming } from "@/lib/metrics";
import { fmtDate, fmtMoney, fmtTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({ meta: [{ title: "الحجوزات والمناسبات — NOTED PHOTO BOOTH" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(bookingsQuery()),
  component: BookingsPage,
});

function BookingsPage() {
  const me = useMe();
  const { data: bookings } = useSuspenseQuery(bookingsQuery());
  const del = useDeleteRecord("bookings");
  const [tab, setTab] = useState<"upcoming" | "past" | "all">("upcoming");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [month, setMonth] = useState("");
  const [editing, setEditing] = useState<Booking | null>(null);
  const [open, setOpen] = useState(false);

  const list = bookings
    .filter((b) => (tab === "all" ? true : tab === "upcoming" ? isUpcoming(b) : !isUpcoming(b)))
    .filter((b) => {
      const s = q.trim().toLowerCase();
      const m = !s || [b.booking_number, b.customer?.full_name, b.venue_name, b.city].some((v) => v?.toLowerCase().includes(s));
      return m && (!status || b.status === status) && (!month || b.event_date.startsWith(month));
    })
    .sort((a, b) => (tab === "past" ? b.event_date.localeCompare(a.event_date) : a.event_date.localeCompare(b.event_date)));

  return (
    <div>
      <PageHeader
        title="الحجوزات والمناسبات"
        description="مواعيد المناسبات والأماكن والباقات والملاحظات التشغيلية"
        actions={
          me.can("bookings.write") && (
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus /> حجز جديد
            </Button>
          )
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="ps-9" placeholder="رقم الحجز أو العميل أو المكان..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <OptionSelect value={status} onChange={setStatus} options={BOOKING_STATUSES.map((s) => ({ value: s, label: BOOKING_STATUS_LABELS[s] }))} allowNone noneLabel="كل الحالات" />
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="الشهر" />
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="upcoming">القادمة</TabsTrigger>
          <TabsTrigger value="past">السابقة والمغلقة</TabsTrigger>
          <TabsTrigger value="all">الكل</TabsTrigger>
        </TabsList>
      </Tabs>
      {list.length === 0 ? (
        <EmptyState icon={<CalendarDays className="size-5" />} title="لا توجد حجوزات" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((b) => (
            <Card key={b.id} className="p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{b.booking_number}{b.source !== "manual" && ` · ${b.source}`}</div>
                  <div className="mt-1 font-display text-lg font-semibold">{fmtDate(b.event_date, "EEEE d MMMM yyyy")}</div>
                  {b.customer && (
                    <Link to="/customers/$id" params={{ id: b.customer.id }} className="text-sm text-primary hover:underline">
                      {b.customer.full_name}
                    </Link>
                  )}
                </div>
                <BookingStatusBadge status={b.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {b.venue_name && <span className="flex items-center gap-1"><MapPin className="size-3" />{b.venue_name}{b.city && `، ${b.city}`}</span>}
                {b.start_time && <span className="flex items-center gap-1"><Clock className="size-3" />{fmtTime(b.start_time)}{b.end_time && ` - ${fmtTime(b.end_time)}`}</span>}
                {b.event_type && <span>{b.event_type}</span>}
                {b.package?.name && <span>{b.package.name}</span>}
                <span>{fmtMoney(b.total_value)}</span>
                <span>التنفيذ: {b.assignee?.full_name ?? "غير مُسند"}</span>
              </div>
              {b.operational_notes && <p className="mt-3 line-clamp-3 rounded-lg bg-muted p-2 text-xs whitespace-pre-wrap">{b.operational_notes}</p>}
              <div className="mt-3 flex justify-end gap-1">
                {me.can("bookings.write") && (
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(b); setOpen(true); }}>تعديل</Button>
                )}
                {me.can("records.delete") && (
                  <ConfirmDelete onConfirm={() => del.mutate(b.id)} trigger={<Button size="sm" variant="ghost" className="text-destructive">حذف</Button>} />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      <BookingFormDialog open={open} onOpenChange={setOpen} booking={editing} />
    </div>
  );
}
