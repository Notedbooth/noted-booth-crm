import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRight, Building2, CalendarPlus, Mail, MapPin, MessageCircle, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CustomerFormDialog } from "@/components/crm/customer-form";
import { LeadFormDialog } from "@/components/crm/lead-form";
import { BookingFormDialog } from "@/components/crm/booking-form";
import { TaskFormDialog } from "@/components/crm/task-form";
import { ConfirmDelete } from "@/components/crm/confirm-delete";
import { ActivityFeed } from "@/components/crm/activity-feed";
import { BookingStatusBadge, PriorityBadge, StageBadge, TaskStatusBadge } from "@/components/crm/badges";
import { OptionSelect } from "@/components/crm/fields";
import { useMe } from "@/components/crm/me-context";
import {
  activityQuery,
  bookingsQuery,
  customerQuery,
  interactionsQuery,
  leadsQuery,
  tasksQuery,
  useDeleteRecord,
  useSaveRecord,
  type Booking,
  type Lead,
  type Task,
} from "@/lib/data";
import { INTERACTION_LABELS, INTERACTION_TYPES, type InteractionType } from "@/lib/constants";
import { fmtDate, fmtDateTime, fmtMoney, fmtRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/customers/")({
  head: () => ({ meta: [{ title: "ملف العميل — NOTED PHOTO BOOTH" }] }),
  loader: async ({ context, params }) => {
    const c = await context.queryClient.ensureQueryData(customerQuery(params.id));
    if (!c) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData(leadsQuery()),
      context.queryClient.ensureQueryData(bookingsQuery()),
      context.queryClient.ensureQueryData(tasksQuery()),
    ]);
  },
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <p className="text-muted-foreground">العميل غير موجود أو تم حذفه.</p>
      <Button asChild variant="link">
        <Link to="/customers">العودة لقائمة العملاء</Link>
      </Button>
    </div>
  ),
  component: CustomerDetail,
});

function waLink(n: string) {
  let d = n.replace(/\D/g, "");
  if (d.startsWith("05")) d = "966" + d.slice(1);
  return `https://wa.me/${d}`;
}

function CustomerDetail() {
  const { id } = Route.useParams();
  const me = useMe();
  const navigate = useNavigate();
  const { data: customer } = useSuspenseQuery(customerQuery(id));
  const { data: allLeads } = useSuspenseQuery(leadsQuery());
  const { data: allBookings } = useSuspenseQuery(bookingsQuery());
  const { data: allTasks } = useSuspenseQuery(tasksQuery());
  const { data: interactions = [] } = useQuery(interactionsQuery(id));
  const { data: activity = [] } = useQuery(activityQuery({ customerId: id, limit: 100 }));
  const del = useDeleteRecord("customers");

  const [dialog, setDialog] = useState<null | "edit" | "lead" | "booking" | "task">(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [bookingFromLead, setBookingFromLead] = useState<Lead | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);

  if (!customer) return null;
  const leads = allLeads.filter((l) => l.customer_id === id);
  const bookings = allBookings.filter((b) => b.customer_id === id);
  const tasks = allTasks.filter((t) => t.customer_id === id);
  const close = () => {
    setDialog(null);
    setEditLead(null);
    setEditBooking(null);
    setBookingFromLead(null);
    setEditTask(null);
  };

  return (
    <div className="space-y-6">
      <Link to="/customers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowRight className="size-4" /> العملاء
      </Link>

      <Card className="shadow-soft">
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <h1 className="font-display text-3xl font-bold">{customer.full_name}</h1>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 hover:text-primary" dir="ltr">
                  <Phone className="size-4" /> {customer.phone}
                </a>
              )}
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 hover:text-primary">
                  <Mail className="size-4" /> {customer.email}
                </a>
              )}
              {customer.company && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-4" /> {customer.company}
                </span>
              )}
              {customer.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" /> {customer.city}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              المصدر: {customer.source ?? "—"} · أضيف {fmtRelative(customer.created_at)}
            </div>
            {customer.notes && <p className="max-w-2xl rounded-xl bg-muted p-3 text-sm whitespace-pre-wrap">{customer.notes}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {(customer.whatsapp || customer.phone) && (
              <Button asChild variant="outline">
                <a href={waLink(customer.whatsapp || customer.phone || "")} target="_blank" rel="noreferrer">
                  <MessageCircle /> واتساب
                </a>
              </Button>
            )}
            {me.can("customers.write") && (
              <Button variant="outline" onClick={() => setDialog("edit")}>
                <Pencil /> تعديل
              </Button>
            )}
            {me.can("records.delete") && (
              <ConfirmDelete
                description="سيتم حذف العميل وجميع فرصه وسجل التواصل. لا يمكن حذف عميل لديه حجوزات."
                onConfirm={() => del.mutate(id, { onSuccess: () => navigate({ to: "/customers" }) })}
                trigger={
                  <Button variant="outline" className="text-destructive">
                    <Trash2 /> حذف
                  </Button>
                }
              />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="الفرص" value={leads.length} />
        <MiniStat label="الحجوزات" value={bookings.length} />
        <MiniStat label="المتابعات المفتوحة" value={tasks.filter((t) => t.status === "open" || t.status === "in_progress").length} />
        <MiniStat label="إجمالي الحجوزات" value={fmtMoney(bookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + Number(b.total_value ?? 0), 0))} />
      </div>

      <Tabs defaultValue="leads">
        <TabsList className="h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="leads">الفرص ({leads.length})</TabsTrigger>
          <TabsTrigger value="bookings">الحجوزات ({bookings.length})</TabsTrigger>
          <TabsTrigger value="tasks">المتابعات ({tasks.length})</TabsTrigger>
          <TabsTrigger value="interactions">سجل التواصل ({interactions.length})</TabsTrigger>
          <TabsTrigger value="activity">سجل التغييرات</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-4 space-y-3">
          {me.can("leads.write") && (
            <Button size="sm" onClick={() => setDialog("lead")}>
              <Plus /> فرصة جديدة
            </Button>
          )}
          {leads.length === 0 && <Empty text="لا توجد فرص بيع لهذا العميل" />}
          {leads.map((l) => (
            <Card key={l.id} className="p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{l.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[l.event_type, l.event_date && fmtDate(l.event_date), l.venue, l.package?.name].filter(Boolean).join(" · ")}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    القيمة المتوقعة: {fmtMoney(l.estimated_value)} · المسؤول: {l.assignee?.full_name ?? "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StageBadge stage={l.stage} />
                  {me.can("bookings.write") && l.stage === "confirmed" && !bookings.some((b) => b.lead_id === l.id) && (
                    <Button size="sm" variant="outline" onClick={() => { setBookingFromLead(l); setDialog("booking"); }}>
                      <CalendarPlus /> إنشاء حجز
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { setEditLead(l); setDialog("lead"); }}>
                    تعديل
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="bookings" className="mt-4 space-y-3">
          {me.can("bookings.write") && (
            <Button size="sm" onClick={() => setDialog("booking")}>
              <Plus /> حجز جديد
            </Button>
          )}
          {bookings.length === 0 && <Empty text="لا توجد حجوزات لهذا العميل" />}
          {bookings.map((b) => (
            <Card key={b.id} className="p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {b.booking_number} · {fmtDate(b.event_date)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[b.event_type, b.venue_name, b.city, b.package?.name].filter(Boolean).join(" · ")}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">القيمة: {fmtMoney(b.total_value)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <BookingStatusBadge status={b.status} />
                  <Button size="sm" variant="ghost" onClick={() => { setEditBooking(b); setDialog("booking"); }}>
                    تعديل
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4 space-y-3">
          <Button size="sm" onClick={() => setDialog("task")}>
            <Plus /> مهمة متابعة
          </Button>
          {tasks.length === 0 && <Empty text="لا توجد متابعات لهذا العميل" />}
          {tasks.map((t) => (
            <Card key={t.id} className="cursor-pointer p-4 shadow-soft hover:bg-muted/40" onClick={() => { setEditTask(t); setDialog("task"); }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {fmtDateTime(t.due_date)} · {t.assignee?.full_name ?? "غير مُسند"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <PriorityBadge priority={t.priority} />
                  <TaskStatusBadge status={t.status} />
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="interactions" className="mt-4 space-y-4">
          <InteractionComposer customerId={id} />
          {interactions.length === 0 && <Empty text="لم يُسجل أي تواصل بعد" />}
          <div className="space-y-3">
            {interactions.map((i) => (
              <Card key={i.id} className="p-4 shadow-soft">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">{INTERACTION_LABELS[i.type]}</span>
                  <span>
                    {i.author?.full_name ?? "—"} · {fmtDateTime(i.occurred_at)}
                  </span>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap">{i.content}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="p-6 shadow-soft">
            <ActivityFeed items={activity} />
          </Card>
        </TabsContent>
      </Tabs>

      <CustomerFormDialog open={dialog === "edit"} onOpenChange={(o) => !o && close()} customer={customer} />
      <LeadFormDialog open={dialog === "lead"} onOpenChange={(o) => !o && close()} lead={editLead} defaultCustomerId={id} />
      <BookingFormDialog
        open={dialog === "booking"}
        onOpenChange={(o) => !o && close()}
        booking={editBooking}
        fromLead={bookingFromLead}
        defaultCustomerId={id}
      />
      <TaskFormDialog open={dialog === "task"} onOpenChange={(o) => !o && close()} task={editTask} defaults={{ customer_id: id }} />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4 shadow-soft">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-bold">{value}</div>
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">{text}</p>;
}

function InteractionComposer({ customerId }: { customerId: string }) {
  const [type, setType] = useState<InteractionType>("call");
  const [content, setContent] = useState("");
  const save = useSaveRecord("customer_interactions");
  async function submit(e: FormEvent): Promise<unknown> {
    e.preventDefault();
    if (!content.trim()) { toast.error("اكتب ملخص التواصل"); return; }
    const ok = await save.mutateAsync({ values: { customer_id: customerId, type, content: content.trim() } }).catch(() => null);
    if (ok) {
      setContent("");
      toast.success("تم تسجيل التواصل");
    }
  }
  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">تسجيل تواصل جديد</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="w-48">
            <OptionSelect value={type} onChange={(v) => v && setType(v as InteractionType)} options={INTERACTION_TYPES.map((t) => ({ value: t, label: INTERACTION_LABELS[t] }))} />
          </div>
          <Textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder="ماذا دار في التواصل؟" />
          <Button type="submit" size="sm" disabled={save.isPending}>
            حفظ
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
