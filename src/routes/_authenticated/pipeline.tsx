import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, type DragEvent } from "react";
import { toast } from "sonner";
import { CalendarDays, KanbanSquare, List, Plus, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/crm/page-header";
import { StageBadge, STAGE_TONE } from "@/components/crm/badges";
import { LeadFormDialog } from "@/components/crm/lead-form";
import { BookingFormDialog } from "@/components/crm/booking-form";
import { ConfirmDelete } from "@/components/crm/confirm-delete";
import { MemberSelect, OptionSelect } from "@/components/crm/fields";
import { useMe } from "@/components/crm/me-context";
import { leadsQuery, useDeleteRecord, useSaveRecord, type Lead, type LeadWithRefs } from "@/lib/data";
import { LEAD_STAGES, LEAD_STAGE_LABELS, type LeadStage } from "@/lib/constants";
import { fmtDate, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pipeline")({
  head: () => ({ meta: [{ title: "مسار المبيعات — NOTED PHOTO BOOTH" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(leadsQuery()),
  component: PipelinePage,
});

function PipelinePage() {
  const me = useMe();
  const { data: leads } = useSuspenseQuery(leadsQuery());
  const save = useSaveRecord("leads");
  const del = useDeleteRecord("leads");
  const [view, setView] = useState<"board" | "list">("board");
  const [q, setQ] = useState("");
  const [assignee, setAssignee] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [newStage, setNewStage] = useState<LeadStage | undefined>();
  const [bookingFrom, setBookingFrom] = useState<Lead | null>(null);
  const [dragOver, setDragOver] = useState<LeadStage | null>(null);

  const filtered = leads.filter((l) => {
    const t = q.trim().toLowerCase();
    const m = !t || [l.title, l.customer?.full_name, l.customer?.phone, l.venue].some((v) => v?.toLowerCase().includes(t));
    return m && (!assignee || l.assigned_to === assignee) && (!stageFilter || l.stage === stageFilter);
  });

  function moveTo(lead: LeadWithRefs, stage: LeadStage) {
    if (lead.stage === stage) return;
    if (!me.can("leads.write") && !["in_execution", "completed"].includes(stage)) {
      toast.error("ليست لديك صلاحية لتغيير هذه المرحلة");
      return;
    }
    save.mutate(
      { id: lead.id, values: { stage } },
      {
        onSuccess: () => {
          if (stage === "confirmed" && me.can("bookings.write")) {
            toast.success("تم تأكيد الفرصة", {
              action: { label: "إنشاء حجز", onClick: () => setBookingFrom(lead) },
              duration: 8000,
            });
          } else if (stage === "lost") {
            toast("تم نقل الفرصة إلى خسارة", { action: { label: "إضافة السبب", onClick: () => openEdit(lead) } });
          } else {
            toast.success(`نُقلت إلى «${LEAD_STAGE_LABELS[stage]}»`);
          }
        },
      },
    );
  }

  function openEdit(l: Lead) {
    setEditing(l);
    setNewStage(undefined);
    setFormOpen(true);
  }
  function openNew(stage?: LeadStage) {
    setEditing(null);
    setNewStage(stage);
    setFormOpen(true);
  }

  function onDrop(e: DragEvent, stage: LeadStage) {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/plain");
    const lead = leads.find((l) => l.id === id);
    if (lead) moveTo(lead, stage);
  }

  return (
    <div>
      <PageHeader
        title="مسار المبيعات"
        description="اسحب البطاقات بين المراحل أو غيّر المرحلة من البطاقة"
        actions={
          <>
            <div className="flex rounded-lg border bg-card p-0.5">
              <Button size="sm" variant={view === "board" ? "secondary" : "ghost"} onClick={() => setView("board")}>
                <KanbanSquare /> لوحة
              </Button>
              <Button size="sm" variant={view === "list" ? "secondary" : "ghost"} onClick={() => setView("list")}>
                <List /> قائمة
              </Button>
            </div>
            {me.can("leads.write") && (
              <Button onClick={() => openNew()}>
                <Plus /> فرصة جديدة
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px_200px]">
        <div className="relative">
          <Search className="absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="ps-9" placeholder="ابحث بالعنوان أو العميل أو المكان..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <MemberSelect value={assignee} onChange={setAssignee} />
        <OptionSelect
          value={stageFilter}
          onChange={setStageFilter}
          options={LEAD_STAGES.map((s) => ({ value: s, label: LEAD_STAGE_LABELS[s] }))}
          allowNone
          noneLabel="كل المراحل"
        />
      </div>

      {view === "board" ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
          <div className="flex gap-4" style={{ minWidth: "max-content" }}>
            {LEAD_STAGES.filter((s) => !stageFilter || s === stageFilter).map((stage) => {
              const items = filtered.filter((l) => l.stage === stage);
              const total = items.reduce((s, l) => s + Number(l.estimated_value ?? 0), 0);
              return (
                <div
                  key={stage}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(stage);
                  }}
                  onDragLeave={() => setDragOver((s) => (s === stage ? null : s))}
                  onDrop={(e) => onDrop(e, stage)}
                  className={cn(
                    "flex w-72 shrink-0 flex-col rounded-2xl border bg-muted/50 transition-colors",
                    dragOver === stage && "border-accent bg-mist",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 border-b px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2.5 rounded-full", STAGE_TONE[stage].split(" ")[0])} />
                      <span className="text-sm font-semibold">{LEAD_STAGE_LABELS[stage]}</span>
                      <span className="rounded-full bg-card px-2 text-xs text-muted-foreground">{items.length}</span>
                    </div>
                    {me.can("leads.write") && (
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => openNew(stage)} aria-label="إضافة">
                        <Plus />
                      </Button>
                    )}
                  </div>
                  {total > 0 && <div className="px-3 pt-2 text-xs text-muted-foreground">{fmtMoney(total)}</div>}
                  <div className="flex min-h-24 flex-1 flex-col gap-2 p-2">
                    {items.map((l) => (
                      <div
                        key={l.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", l.id)}
                        className="cursor-grab rounded-xl border bg-card p-3 shadow-soft active:cursor-grabbing"
                      >
                        <button className="block w-full text-start" onClick={() => openEdit(l)}>
                          <div className="text-sm font-semibold">{l.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{l.customer?.full_name}</div>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {l.event_date && (
                              <span className="flex items-center gap-1">
                                <CalendarDays className="size-3" />
                                {fmtDate(l.event_date)}
                              </span>
                            )}
                            {l.assignee && (
                              <span className="flex items-center gap-1">
                                <User className="size-3" />
                                {l.assignee.full_name}
                              </span>
                            )}
                          </div>
                          {l.estimated_value != null && <div className="mt-2 text-sm font-medium">{fmtMoney(l.estimated_value)}</div>}
                        </button>
                        <div className="mt-2 border-t pt-2">
                          <OptionSelect
                            value={l.stage}
                            onChange={(v) => v && moveTo(l, v as LeadStage)}
                            options={LEAD_STAGES.map((s) => ({ value: s, label: LEAD_STAGE_LABELS[s] }))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="overflow-x-auto shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">الفرصة</TableHead>
                <TableHead className="text-start">العميل</TableHead>
                <TableHead className="text-start">المرحلة</TableHead>
                <TableHead className="text-start">تاريخ المناسبة</TableHead>
                <TableHead className="text-start">القيمة المتوقعة</TableHead>
                <TableHead className="text-start">المسؤول</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    لا توجد فرص مطابقة
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.title}</TableCell>
                  <TableCell>
                    {l.customer && (
                      <Link to="/customers/$id" params={{ id: l.customer.id }} className="hover:text-primary hover:underline">
                        {l.customer.full_name}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>
                    <StageBadge stage={l.stage} />
                  </TableCell>
                  <TableCell>{fmtDate(l.event_date)}</TableCell>
                  <TableCell>{fmtMoney(l.estimated_value)}</TableCell>
                  <TableCell>{l.assignee?.full_name ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(l)}>
                        تعديل
                      </Button>
                      {me.can("records.delete") && (
                        <ConfirmDelete
                          onConfirm={() => del.mutate(l.id)}
                          trigger={
                            <Button size="sm" variant="ghost" className="text-destructive">
                              حذف
                            </Button>
                          }
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} lead={editing} defaultStage={newStage} />
      <BookingFormDialog open={!!bookingFrom} onOpenChange={(o) => !o && setBookingFrom(null)} fromLead={bookingFrom} />
    </div>
  );
}
