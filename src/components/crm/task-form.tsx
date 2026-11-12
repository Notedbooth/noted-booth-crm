import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveRecord, type Task } from "@/lib/data";
import { clean } from "@/lib/format";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/constants";
import { CustomerPicker, Field, MemberSelect, OptionSelect } from "./fields";
import { useMe } from "./me-context";

type Defaults = { customer_id?: string | null; lead_id?: string | null; booking_id?: string | null; title?: string };

type FormState = {
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  customer_id: string | null;
  lead_id: string | null;
  booking_id: string | null;
  assigned_to: string | null;
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaults,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task?: Task | null | undefined;
  defaults?: Defaults | undefined;
}) {
  const me = useMe();
  const save = useSaveRecord("tasks");
  const blank = (): FormState => ({
    title: defaults?.title ?? "",
    description: "",
    due_date: format(new Date(Date.now() + 24 * 3600 * 1000), "yyyy-MM-dd'T'10:00"),
    priority: "medium",
    status: "open",
    customer_id: defaults?.customer_id ?? null,
    lead_id: defaults?.lead_id ?? null,
    booking_id: defaults?.booking_id ?? null,
    assigned_to: me.userId,
  });
  const [form, setForm] = useState<FormState>(blank);

  useEffect(() => {
    if (!open) return;
    setForm(
      task
        ? {
            title: task.title,
            description: task.description ?? "",
            due_date: toLocalInput(task.due_date),
            priority: task.priority,
            status: task.status,
            customer_id: task.customer_id,
            lead_id: task.lead_id,
            booking_id: task.booking_id,
            assigned_to: task.assigned_to,
          }
        : blank(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (form.title.trim().length < 2) { toast.error("عنوان المهمة مطلوب"); return; }
    const values = clean({
      ...form,
      title: form.title.trim(),
      due_date: form.due_date ? new Date(form.due_date).toISOString() : "",
    });
    const saved = await save.mutateAsync({ id: task?.id, values: values as never }).catch(() => null);
    if (!saved) return;
    toast.success(task ? "تم تحديث المهمة" : "تمت إضافة مهمة المتابعة");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? "تعديل المهمة" : "مهمة متابعة جديدة"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="عنوان المهمة" required className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="مثال: الاتصال لتأكيد عرض السعر" autoFocus />
          </Field>
          <Field label="تاريخ ووقت الاستحقاق">
            <Input type="datetime-local" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
          </Field>
          <Field label="الأولوية">
            <OptionSelect
              value={form.priority}
              onChange={(v) => v && set("priority", v as TaskPriority)}
              options={TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] }))}
            />
          </Field>
          <Field label="الحالة">
            <OptionSelect
              value={form.status}
              onChange={(v) => v && set("status", v as TaskStatus)}
              options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
            />
          </Field>
          <Field label="المسؤول">
            <MemberSelect value={form.assigned_to} onChange={(v) => set("assigned_to", v)} />
          </Field>
          <Field label="العميل المرتبط" className="sm:col-span-2">
            <CustomerPicker value={form.customer_id} onChange={(v) => set("customer_id", v)} allowCreate={false} />
          </Field>
          <Field label="التفاصيل" className="sm:col-span-2">
            <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "جارٍ الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
