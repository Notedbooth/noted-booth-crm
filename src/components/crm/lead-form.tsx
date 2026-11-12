import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveRecord, type Lead } from "@/lib/data";
import { clean } from "@/lib/format";
import { EVENT_TYPES, LEAD_SOURCES, LEAD_STAGES, LEAD_STAGE_LABELS, type LeadStage } from "@/lib/constants";
import { CustomerPicker, Field, MemberSelect, OptionSelect, PackageSelect, SuggestInput } from "./fields";
import { useMe } from "./me-context";

type FormState = {
  customer_id: string | null;
  title: string;
  stage: LeadStage;
  event_type: string;
  event_date: string;
  venue: string;
  guests: string;
  package_id: string | null;
  estimated_value: string;
  source: string;
  assigned_to: string | null;
  lost_reason: string;
  notes: string;
};

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  defaultCustomerId,
  defaultStage,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead?: Lead | null;
  defaultCustomerId?: string;
  defaultStage?: LeadStage;
}) {
  const me = useMe();
  const save = useSaveRecord("leads");
  const [form, setForm] = useState<FormState>(() => blank());

  function blank(): FormState {
    return {
      customer_id: defaultCustomerId ?? null,
      title: "",
      stage: defaultStage ?? "new_lead",
      event_type: "",
      event_date: "",
      venue: "",
      guests: "",
      package_id: null,
      estimated_value: "",
      source: "",
      assigned_to: me.userId,
      lost_reason: "",
      notes: "",
    };
  }

  useEffect(() => {
    if (!open) return;
    setForm(
      lead
        ? {
            customer_id: lead.customer_id,
            title: lead.title,
            stage: lead.stage,
            event_type: lead.event_type ?? "",
            event_date: lead.event_date ?? "",
            venue: lead.venue ?? "",
            guests: lead.guests?.toString() ?? "",
            package_id: lead.package_id,
            estimated_value: lead.estimated_value?.toString() ?? "",
            source: lead.source ?? "",
            assigned_to: lead.assigned_to,
            lost_reason: lead.lost_reason ?? "",
            notes: lead.notes ?? "",
          }
        : blank(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer_id) return toast.error("اختر العميل");
    if (form.title.trim().length < 2) return toast.error("عنوان الفرصة مطلوب");
    const guests = form.guests ? Number(form.guests) : null;
    const value = form.estimated_value ? Number(form.estimated_value) : null;
    if ((guests !== null && (!Number.isFinite(guests) || guests < 0)) || (value !== null && (!Number.isFinite(value) || value < 0)))
      return toast.error("تحقق من الأرقام المدخلة");
    const values = clean({
      ...form,
      title: form.title.trim(),
      guests,
      estimated_value: value,
      lost_reason: form.stage === "lost" ? form.lost_reason : "",
    });
    const saved = await save.mutateAsync({ id: lead?.id, values: values as never }).catch(() => null);
    if (!saved) return;
    toast.success(lead ? "تم تحديث الفرصة" : "تمت إضافة الفرصة إلى مسار المبيعات");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lead ? "تعديل فرصة البيع" : "فرصة بيع جديدة"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="العميل" required className="sm:col-span-2">
            <CustomerPicker value={form.customer_id} onChange={(v) => set("customer_id", v)} />
          </Field>
          <Field label="عنوان الفرصة" required className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="مثال: زفاف عائلة ... - قاعة ..." />
          </Field>
          <Field label="المرحلة">
            <OptionSelect
              value={form.stage}
              onChange={(v) => v && set("stage", v as LeadStage)}
              options={LEAD_STAGES.map((s) => ({ value: s, label: LEAD_STAGE_LABELS[s] }))}
            />
          </Field>
          <Field label="المسؤول">
            <MemberSelect value={form.assigned_to} onChange={(v) => set("assigned_to", v)} />
          </Field>
          <Field label="نوع المناسبة">
            <SuggestInput id="lead-event-types" value={form.event_type} onChange={(v) => set("event_type", v)} suggestions={EVENT_TYPES} />
          </Field>
          <Field label="تاريخ المناسبة">
            <Input type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} />
          </Field>
          <Field label="المكان">
            <Input value={form.venue} onChange={(e) => set("venue", e.target.value)} />
          </Field>
          <Field label="عدد الضيوف">
            <Input type="number" min={0} value={form.guests} onChange={(e) => set("guests", e.target.value)} />
          </Field>
          <Field label="الباقة المقترحة">
            <PackageSelect value={form.package_id} onChange={(v) => set("package_id", v)} />
          </Field>
          <Field label="القيمة المتوقعة">
            <Input type="number" min={0} step="0.01" value={form.estimated_value} onChange={(e) => set("estimated_value", e.target.value)} />
          </Field>
          <Field label="المصدر">
            <SuggestInput id="lead-sources" value={form.source} onChange={(v) => set("source", v)} suggestions={LEAD_SOURCES} />
          </Field>
          {form.stage === "lost" && (
            <Field label="سبب الخسارة">
              <Input value={form.lost_reason} onChange={(e) => set("lost_reason", e.target.value)} />
            </Field>
          )}
          <Field label="ملاحظات" className="sm:col-span-2">
            <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
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
