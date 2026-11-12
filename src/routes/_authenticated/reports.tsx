import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format, startOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/crm/page-header";
import { useMe } from "@/components/crm/me-context";
import { activityQuery, bookingsQuery, leadsQuery, teamQuery } from "@/lib/data";
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS, LEAD_STAGES, LEAD_STAGE_LABELS, WON_STAGES } from "@/lib/constants";
import { conversionRate, inRange, salesTotal } from "@/lib/metrics";
import { fmtMoney, fmtNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "التقارير — NOTED PHOTO BOOTH" }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(leadsQuery()), context.queryClient.ensureQueryData(bookingsQuery())]),
  component: ReportsPage,
});

function ReportsPage() {
  const me = useMe();
  const [from, setFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const range = { from: new Date(from), to: new Date(to) };
  const { data: leads } = useSuspenseQuery(leadsQuery());
  const { data: bookings } = useSuspenseQuery(bookingsQuery());
  const { data: team = [] } = useQuery(teamQuery());
  const { data: activity = [] } = useQuery(activityQuery({ from: new Date(from + "T00:00:00").toISOString(), to: new Date(to + "T23:59:59").toISOString() }));
  if (!me.can("reports.view")) return <p className="py-20 text-center text-muted-foreground">هذه الصفحة متاحة للمدراء فقط.</p>;

  const scopedLeads = leads.filter((l) => inRange(l.created_at, range));
  const scopedBookings = bookings.filter((b) => inRange(b.event_date, range));
  const sources = Object.entries(scopedLeads.reduce<Record<string, number>>((m, l) => ({ ...m, [l.source || "غير محدد"]: (m[l.source || "غير محدد"] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="التقارير"
        description="العملاء المحتملون والتحويل والحجوزات ونشاط الفريق"
        actions={
          <div className="flex items-center gap-2 text-sm">
            من <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            إلى <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="عملاء محتملون جدد" value={fmtNumber(scopedLeads.length)} />
        <Kpi label="نسبة التحويل" value={`${conversionRate(leads, range)}%`} />
        <Kpi label="حجوزات في الفترة" value={fmtNumber(scopedBookings.filter((b) => b.status !== "cancelled").length)} />
        <Kpi label="المبيعات" value={fmtMoney(salesTotal(bookings, range))} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-lg">الفرص حسب المرحلة</CardTitle></CardHeader>
          <CardContent>
            <Table><TableBody>
              {LEAD_STAGES.map((s) => (
                <TableRow key={s}><TableCell>{LEAD_STAGE_LABELS[s]}</TableCell><TableCell className="text-end font-medium">{scopedLeads.filter((l) => l.stage === s).length}</TableCell></TableRow>
              ))}
            </TableBody></Table>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-lg">مصادر العملاء المحتملين</CardTitle></CardHeader>
          <CardContent>
            <Table><TableBody>
              {sources.length === 0 && <TableRow><TableCell className="text-muted-foreground">لا توجد بيانات</TableCell></TableRow>}
              {sources.map(([s, n]) => (
                <TableRow key={s}><TableCell>{s}</TableCell><TableCell className="text-end font-medium">{n}</TableCell>
                  <TableCell className="text-end text-xs text-muted-foreground">تحويل {conversionRate(scopedLeads.filter((l) => (l.source || "غير محدد") === s))}%</TableCell></TableRow>
              ))}
            </TableBody></Table>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-lg">الحجوزات حسب الحالة</CardTitle></CardHeader>
          <CardContent>
            <Table><TableBody>
              {BOOKING_STATUSES.map((s) => (
                <TableRow key={s}><TableCell>{BOOKING_STATUS_LABELS[s]}</TableCell><TableCell className="text-end font-medium">{scopedBookings.filter((b) => b.status === s).length}</TableCell></TableRow>
              ))}
            </TableBody></Table>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-lg">أداء ونشاط الفريق</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-start">العضو</TableHead><TableHead className="text-start">فرص مُسندة</TableHead><TableHead className="text-start">فرص مكسوبة</TableHead><TableHead className="text-start">إجراءات</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {team.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.full_name}</TableCell>
                    <TableCell>{scopedLeads.filter((l) => l.assigned_to === m.id).length}</TableCell>
                    <TableCell>{scopedLeads.filter((l) => l.assigned_to === m.id && WON_STAGES.includes(l.stage)).length}</TableCell>
                    <TableCell>{activity.filter((a) => a.actor_id === m.id).length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <Card className="p-5 shadow-soft"><div className="text-sm text-muted-foreground">{label}</div><div className="mt-2 font-display text-2xl font-bold">{value}</div></Card>;
}
