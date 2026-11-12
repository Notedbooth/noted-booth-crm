import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveRecord, type Customer } from "@/lib/data";
import { clean } from "@/lib/format";
import { LEAD_SOURCES } from "@/lib/constants";
import { Field, SuggestInput } from "./fields";

const schema = z.object({
  full_name: z.string().trim().min(2, "الاسم مطلوب (حرفان على الأقل)").max(150),
  phone: z.string().trim().max(30).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  email: z.union([z.literal(""), z.string().trim().email("البريد الإلكتروني غير صحيح").max(255)]).optional(),
  company: z.string().trim().max(150).optional(),
  city: z.string().trim().max(100).optional(),
  source: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(5000).optional(),
});

type FormState = z.infer<typeof schema>;
const empty: FormState = { full_name: "", phone: "", whatsapp: "", email: "", company: "", city: "", source: "", notes: "" };

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customer?: Customer | null | undefined;
  onSaved?: (c: Customer) => void | undefined;
}) {
  const [form, setForm] = useState<FormState>(empty);
  const save = useSaveRecord("customers");

  useEffect(() => {
    if (open)
      setForm(
        customer
          ? {
              full_name: customer.full_name,
              phone: customer.phone ?? "",
              whatsapp: customer.whatsapp ?? "",
              email: customer.email ?? "",
              company: customer.company ?? "",
              city: customer.city ?? "",
              source: customer.source ?? "",
              notes: customer.notes ?? "",
            }
          : empty,
      );
  }, [open, customer]);

  const set = (k: keyof FormState) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message); return; }
    const saved = await save.mutateAsync({ id: customer?.id, values: clean(parsed.data) as never }).catch(() => null);
    if (!saved) return;
    toast.success(customer ? "تم تحديث بيانات العميل" : "تمت إضافة العميل");
    onSaved?.(saved);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{customer ? "تعديل بيانات العميل" : "عميل جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="الاسم الكامل" required className="sm:col-span-2">
            <Input value={form.full_name} onChange={set("full_name")} autoFocus />
          </Field>
          <Field label="رقم الجوال">
            <Input value={form.phone} onChange={set("phone")} dir="ltr" inputMode="tel" placeholder="05xxxxxxxx" />
          </Field>
          <Field label="واتساب">
            <Input value={form.whatsapp} onChange={set("whatsapp")} dir="ltr" inputMode="tel" />
          </Field>
          <Field label="البريد الإلكتروني">
            <Input value={form.email} onChange={set("email")} dir="ltr" type="email" />
          </Field>
          <Field label="الجهة / الشركة">
            <Input value={form.company} onChange={set("company")} />
          </Field>
          <Field label="المدينة">
            <Input value={form.city} onChange={set("city")} />
          </Field>
          <Field label="مصدر العميل">
            <SuggestInput id="customer-sources" value={form.source ?? ""} onChange={(v) => setForm((f) => ({ ...f, source: v }))} suggestions={LEAD_SOURCES} />
          </Field>
          <Field label="ملاحظات" className="sm:col-span-2">
            <Textarea value={form.notes} onChange={set("notes")} rows={3} />
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
