import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { isAfter, isToday, parseISO, startOfDay, addDays } from "date-fns";
import { ListChecks, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader } from "@/components/crm/page-header";
import { PriorityBadge, TaskStatusBadge } from "@/components/crm/badges";
import { TaskFormDialog } from "@/components/crm/task-form";
import { ConfirmDelete } from "@/components/crm/confirm-delete";
import { MemberSelect, OptionSelect } from "@/components/crm/fields";
import { useMe } from "@/components/crm/me-context";
import { tasksQuery, useDeleteRecord, useSaveRecord, type Task, type TaskWithRefs } from "@/lib/data";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/lib/constants";
import { isOverdue } from "@/lib/metrics";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "المتابعات — NOTED PHOTO BOOTH" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(tasksQuery()),
  component: TasksPage,
});

type Tab = "overdue" | "today" | "upcoming" | "done" | "all";
const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 } as const;

function TasksPage() {
  const me = useMe();
  const { data: tasks } = useSuspenseQuery(tasksQuery());
  const save = useSaveRecord("tasks");
  const del = useDeleteRecord("tasks");
  const [tab, setTab] = useState<Tab>("today");
  const [q, setQ] = useState("");
  const [assignee, setAssignee] = useState<string | null>(null);
  const [priority, setPriority] = useState<string | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);

  const active = (t: TaskWithRefs) => t.status === "open" || t.status === "in_progress";
  const buckets: Record<Tab, (t: TaskWithRefs) => boolean> = {
    overdue: (t) => isOverdue(t),
    today: (t) => active(t) && !!t.due_date && isToday(parseISO(t.due_date)) && !isOverdue(t),
    upcoming: (t) => active(t) && (!t.due_date || isAfter(parseISO(t.due_date), startOfDay(addDays(new Date(), 1)))),
    done: (t) => t.status === "done" || t.status === "cancelled",
    all: () => true,
  };

  const base = tasks.filter((t) => {
    const s = q.trim().toLowerCase();
    const m = !s || [t.title, t.description, t.customer?.full_name].some((v) => v?.toLowerCase().includes(s));
    return m && (!assignee || t.assigned_to === assignee) && (!priority || t.priority === priority);
  });
  const list = base
    .filter(buckets[tab])
    .sort((a, b) => {
      if (tab === "done") return (b.completed_at ?? b.updated_at).localeCompare(a.completed_at ?? a.updated_at);
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || (a.due_date ?? "9").localeCompare(b.due_date ?? "9");
    });

  const count = (t: Tab) => base.filter(buckets[t]).length;

  return (
    <div>
      <PageHeader
        title="المتابعات"
        description="مهام المتابعة مع العملاء والتجهيز للمناسبات"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus /> مهمة جديدة
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px_180px_auto]">
        <div className="relative">
          <Search className="absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="ps-9" placeholder="ابحث في المهام..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <MemberSelect value={assignee} onChange={setAssignee} />
        <OptionSelect
          value={priority}
          onChange={setPriority}
          options={TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] }))}
          allowNone
          noneLabel="كل الأولويات"
        />
        <Button variant={assignee === me.userId ? "secondary" : "outline"} onClick={() => setAssignee(assignee === me.userId ? null : me.userId)}>
          مهامي
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mb-4">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="overdue">متأخرة ({count("overdue")})</TabsTrigger>
          <TabsTrigger value="today">اليوم ({count("today")})</TabsTrigger>
          <TabsTrigger value="upcoming">القادمة ({count("upcoming")})</TabsTrigger>
          <TabsTrigger value="done">المنجزة ({count("done")})</TabsTrigger>
          <TabsTrigger value="all">الكل ({count("all")})</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <EmptyState icon={<ListChecks className="size-5" />} title="لا توجد مهام هنا" description="عند إضافة متابعات ستظهر في هذه القائمة." />
      ) : (
        <div className="space-y-2">
          {list.map((t) => {
            const overdue = isOverdue(t);
            return (
              <Card key={t.id} className={cn("flex items-start gap-3 p-4 shadow-soft", overdue && "border-destructive/40")}>
                <Checkbox
                  className="mt-1"
                  checked={t.status === "done"}
                  onCheckedChange={(c) => save.mutate({ id: t.id, values: { status: c ? "done" : "open" } })}
                  aria-label="تحديد كمنجزة"
                />
                <button
                  className="min-w-0 flex-1 text-start"
                  onClick={() => {
                    setEditing(t);
                    setOpen(true);
                  }}
                >
                  <div className={cn("font-medium", t.status === "done" && "text-muted-foreground line-through")}>{t.title}</div>
                  {t.description && <div className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{t.description}</div>}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <PriorityBadge priority={t.priority} />
                    <TaskStatusBadge status={t.status} />
                    <span className={cn(overdue && "font-semibold text-destructive")}>{t.due_date ? fmtDateTime(t.due_date) : "بدون موعد"}</span>
                    <span>· {t.assignee?.full_name ?? "غير مُسند"}</span>
                  </div>
                </button>
                <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                  {t.customer && (
                    <Link to="/customers/$id" params={{ id: t.customer.id }} className="text-primary hover:underline">
                      {t.customer.full_name}
                    </Link>
                  )}
                  {t.booking && <span className="text-muted-foreground">{t.booking.booking_number}</span>}
                  {(me.can("records.delete") || t.created_by === me.userId) && (
                    <ConfirmDelete
                      onConfirm={() => del.mutate(t.id)}
                      trigger={
                        <Button size="sm" variant="ghost" className="h-7 text-destructive">
                          حذف
                        </Button>
                      }
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <TaskFormDialog open={open} onOpenChange={setOpen} task={editing} />
    </div>
  );
}
