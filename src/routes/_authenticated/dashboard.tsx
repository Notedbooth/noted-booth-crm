import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { endOfMonth, format, isToday, parseISO, startOfMonth, subMonths } from "date-fns";
import { arSA } from "date-fns/locale";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, MapPin, TrendingUp, Users, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/crm/page-header";
import { BookingStatusBadge, PriorityBadge } from "@/components/crm/badges";
import { ActivityFeed } from "@/components/crm/activity-feed";
import { useMe } from "@/components/crm/me-context";
import { activityQuery, bookingsQuery, leadsQuery, tasksQuery, useSaveRecord } from "@/lib/data";
import { LEAD_STAGES, LEAD_STAGE_LABELS, OPEN_STAGES } from "@/lib/constants";
import { conversionRate, inRange, isOverdue, isUpcoming, salesTotal } from "@/lib/metrics";
import { fmtDate, fmtDateTime, fmtMoney, fmtNumber, fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { STAGE_TONE } from "@/components/crm/badges";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "لوحة التحكم — NOTED PHOTO BOOTH" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(leadsQuery()),
      context.queryClient.ensureQueryData(bookingsQuery()),
      context.queryClient.ensureQueryData(tasksQuery()),
    ]),
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, hint, tone }: { icon: typeof Users; label: string; value: string; hint?: string | undefined; tone?: "warn" }) {
  return (
    <Card className="shadow-soft">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-2xl font-bold md:text-3xl">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div className={cn("grid size-10 place-items-center rounded-xl", tone === "warn" ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground")}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const me = useMe();
  const { data: leads } = useSuspenseQuery(leadsQuery());
  const { data: bookings } = useSuspenseQuery(bookingsQuery());
  const { data: tasks } = useSuspenseQuery(tasksQuery());
  const { data: activity = [] } = useQuery(activityQuery({ limit: 8 }));
  const saveTask = useSaveRecord("tasks");

  const now = new Date();
  const month = { from: startOfMonth(now), to: endOfMonth(now) };

  const stats = useMemo(() => {
    const monthLeads = leads.filter((l) => inRange(l.created_at, month));
    const openLeads = leads.filter((l) => OPEN_STAGES.includes(l.stage));
    const upcoming = bookings.filter((b) => isUpcoming(b, now));
    const overdue = tasks.filter((t) => isOverdue(t, now));
    const dueToday = tasks.filter((t) => t.due_date && isToday(parseISO(t.due_date)) && (t.status === "open" || t.status === "in_progress"));
    return {
      monthSales: salesTotal(bookings, month),
      monthLeads: monthLeads.length,
      openLeads: openLeads.length,
      pipelineValue: openLeads.reduce((s, l) => s + Number(l.estimated_value ?? 0), 0),
      upcoming,
      overdue,
      dueToday,
      conversion: conversionRate(leads),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, bookings, tasks]);

  const chart = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(now, 5 - i);
      const r = { from: startOfMonth(d), to: endOfMonth(d) };
      return {
        name: format(d, "MMM", { locale: arSA }),
        sales: salesTotal(bookings, r),
        bookings: bookings.filter((b) => b.status !== "cancelled" && inRange(b.event_date, r)).length,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  const followUps = [...stats.overdue, ...stats.dueToday.filter((t) => !stats.overdue.includes(t))].slice(0, 8);
  const stageCounts = LEAD_STAGES.map((s) => ({ stage: s, count: leads.filter((l) => l.stage === s).length }));
  const maxStage = Math.max(1, ...stageCounts.map((s) => s.count));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`أهلاً ${me.profile?.full_name?.split(" ")[0] ?? ""}`}
        description={`ملخص ${format(now, "MMMM yyyy", { locale: arSA })}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Wallet} label="مبيعات الشهر" value={fmtMoney(stats.monthSales)} hint="قيمة الحجوزات غير الملغاة لهذا الشهر" />
        <Stat icon={Users} label="عملاء محتملون جدد" value={fmtNumber(stats.monthLeads)} hint={`${fmtNumber(stats.openLeads)} فرصة مفتوحة بقيمة ${fmtMoney(stats.pipelineValue)}`} />
        <Stat icon={CalendarDays} label="مناسبات قادمة" value={fmtNumber(stats.upcoming.length)} hint="حجوزات مؤكدة أو قيد التجهيز" />
        <Stat
          icon={AlertTriangle}
          label="متابعات متأخرة"
          value={fmtNumber(stats.overdue.length)}
          hint={`${fmtNumber(stats.dueToday.length)} مستحقة اليوم · التحويل ${stats.conversion}%`}
          tone={stats.overdue.length ? "warn" : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="size-5" /> المبيعات آخر 6 أشهر
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} reversed />
                <YAxis orientation="right" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => fmtNumber(v)} />
                <Tooltip
                  formatter={(v: number, k) => (k === "sales" ? [fmtMoney(v), "المبيعات"] : [v, "الحجوزات"])}
                  contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, direction: "rtl" }}
                />
                <Bar dataKey="sales" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">مسار المبيعات</CardTitle>
            <Link to="/pipeline" className="text-xs text-muted-foreground hover:text-primary">عرض الكل</Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {stageCounts.map(({ stage, count }) => (
              <div key={stage} className="flex items-center gap-3 text-sm">
                <div className="w-32 shrink-0 truncate text-muted-foreground">{LEAD_STAGE_LABELS[stage]}</div>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", STAGE_TONE[stage].split(" ")[0])} style={{ width: `${(count / maxStage) * 100}%` }} />
                </div>
                <div className="w-6 text-end font-medium">{count}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-soft">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">المناسبات القادمة</CardTitle>
            <Link to="/bookings" className="text-xs text-muted-foreground hover:text-primary">كل الحجوزات</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.upcoming.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">لا توجد مناسبات قادمة</p>}
            {stats.upcoming.slice(0, 6).map((b) => (
              <div key={b.id} className="flex gap-3 rounded-xl border bg-background/60 p-3">
                <div className="grid w-12 shrink-0 place-items-center rounded-lg bg-secondary py-1 text-center">
                  <div className="font-display text-lg leading-none font-bold">{format(parseISO(b.event_date), "d")}</div>
                  <div className="text-[10px] text-muted-foreground">{format(parseISO(b.event_date), "MMM", { locale: arSA })}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{b.customer?.full_name}</span>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {b.venue_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" /> {b.venue_name}
                      </span>
                    )}
                    {b.start_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {fmtTime(b.start_time)}
                      </span>
                    )}
                    {b.package?.name && <span>{b.package.name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">متابعات اليوم والمتأخرة</CardTitle>
            <Link to="/tasks" className="text-xs text-muted-foreground hover:text-primary">كل المهام</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {followUps.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
                <CheckCircle2 className="size-6 text-success" /> لا توجد متابعات مستحقة
              </div>
            )}
            {followUps.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-start gap-3 rounded-xl border bg-background/60 p-3">
                <Checkbox
                  className="mt-0.5"
                  checked={false}
                  onCheckedChange={() => saveTask.mutate({ id: t.id, values: { status: "done" } })}
                  aria-label="إنجاز المهمة"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <PriorityBadge priority={t.priority} />
                    <span className={cn(isOverdue(t) && "font-medium text-destructive")}>{fmtDateTime(t.due_date)}</span>
                    {t.customer && <span>· {t.customer.full_name}</span>}
                  </div>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">آخر النشاطات</CardTitle>
            {me.can("activity.view") && (
              <Link to="/activity" className="text-xs text-muted-foreground hover:text-primary">السجل الكامل</Link>
            )}
          </CardHeader>
          <CardContent>
            <ActivityFeed items={activity} compact />
          </CardContent>
        </Card>
      </div>
      <p className="text-center text-xs text-muted-foreground">آخر تحديث: {fmtDate(now, "d MMMM yyyy، h:mm a")}</p>
    </div>
  );
}
