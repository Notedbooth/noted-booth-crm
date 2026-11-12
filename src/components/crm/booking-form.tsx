import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveRecord, type Booking, type Lead } from "@/lib/data";
import { clean } from "@/lib/format";
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS, EVENT_TYPES, type BookingStatus } from "@/lib/constants";
import { CustomerPicker, Field, MemberSelect, OptionSelect, PackageSelect, SuggestInput } from "./fields";

type FormState = {
  customer_id: string | null;
  lead_id: string | null;
  package_id: string | null;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  venue_address: string;
  city: string;
  guests: string;
  status: BookingStatus;
  total_value: string;
  assigned_to: string | null;
  operational_notes: string;
};

function blank(defaultCustomerId?: string, fromLead?: Lead | null): FormState {
  return {
    customer_id: fromLead?.customer_id ?? defaultCustomerId ?? null,
    lead_id: fromLead?.id ?? null,
    package_id: fromLead?.package_id ?? null,
    event_type: fromLead?.event_type ?? "",
    event_date: fromLead?.event_date ?? "",
    start_time: "",
    end_time: "",
    venue_name: fromLead?.venue ?? "",
    venue_address: "",
    city: "",
    guests: fromLead?.guests?.toString() ?? "",
    status: "confirmed",
    total_value: fromLead?.estimated_value?.toString() ?? "",
    assigned_to: null,
    operational_notes: fromLead?.notes ?? "",
  };
}

export function BookingFormDialog({
  open,
  onOpenChange,
  booking,
  defaultCustomerId,
  fromLead,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  booking?: Booking | null | undefined;
  defaultCustomerId?: string | undefined;
  fromLead?: Lead | null | undefined;
  onSaved?: (b: Booking) => void | undefined;
}) {
  const save = useSaveRecord("bookings");
  const [form, setForm] = useState<FormState>(() => blank(defaultCustomerId, fromLead));

  useEffect(() => {
    if (!open) return;
    setForm(
      booking
        ? {
            customer_id: booking.customer_id,
            lead_id: booking.lead_id,
            package_id: booking.package_id,
            event_type: booking.event_type ?? "",
            event_date: booking.event_date,
            start_time: booking.start_time?.slice(0, 5) ?? "",
            end_time: booking.end_time?.slice(0, 5) ?? "",
            venue_name: booking.venue_name ?? "",
            venue_address: booking.venue_address ?? "",
            city: booking.city ?? "",
            guests: booking.guests?.toString() ?? "",
            status: booking.status,
            total_value: booking.total_value?.toString() ?? "",
            assigned_to: booking.assigned_to,
            operational_notes: booking.operational_notes ?? "",
          }
        : blank(defaultCustomerId, fromLead),
    );
  }, [open, booking, defaultCustomerId, fromLead]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: FormEvent): Promise<unknown> {
    e.preventDefault();
    if (!form.customer_id) { toast.error("اختر العميل"); return; }
    if (!form.event_date) { toast.error("تاريخ المناسبة مطلوب"); return; }
    if (form.start_time && form.end_time && form.end_time <= form.start_time)
      { toast.error("وقت الانتهاء يجب أن يكون بعد وقت البدء"); return; }
    const values = clean({
      ...form,
      guests: form.guests ? Number(form.guests) : null,
      total_value: form.total_value ? Number(form.total_value) : null,
    });
    const saved = await save.mutateAsync({ id: booking?.id, values: values as never }).catch(() => null);
    if (!saved) return;
    toast.success(booking ? "تم تحديث الحجز" : `تم إنشاء الحجز ${saved.booking_number}`);
    onSaved?.(saved);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{booking ? `تعديل الحجز ${booking.booking_number}` : "حجز جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="العميل" required className="sm:col-span-2">
            <CustomerPicker value={form.customer_id} onChange={(v) => set("customer_id", v)} />
          </Field>
          <Field label="تاريخ المناسبة" required>
            <Input type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} />
          </Field>
          <Field label="الحالة">
            <OptionSelect
              value={form.status}
              onChange={(v) => v && set("status", v as BookingStatus)}
              options={BOOKING_STATUSES.map((s) => ({ value: s, label: BOOKING_STATUS_LABELS[s] }))}
            />
          </Field>
          <Field label="وقت البدء">
            <Input type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
          </Field>
          <Field label="وقت الانتهاء">
            <Input type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} />
          </Field>
          <Field label="نوع المناسبة">
            <SuggestInput id="booking-event-types" value={form.event_type} onChange={(v) => set("event_type", v)} suggestions={EVENT_TYPES} />
          </Field>
          <Field label="الباقة">
            <PackageSelect value={form.package_id} onChange={(v) => set("package_id", v)} />
          </Field>
          <Field label="القاعة / المكان">
            <Input value={form.venue_name} onChange={(e) => set("venue_name", e.target.value)} />
          </Field>
          <Field label="المدينة">
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="العنوان التفصيلي / رابط الموقع" className="sm:col-span-2">
            <Input value={form.venue_address} onChange={(e) => set("venue_address", e.target.value)} />
          </Field>
          <Field label="عدد الضيوف">
            <Input type="number" min={0} value={form.guests} onChange={(e) => set("guests", e.target.value)} />
          </Field>
          <Field label="قيمة الحجز">
            <Input type="number" min={0} step="0.01" value={form.total_value} onChange={(e) => set("total_value", e.target.value)} />
          </Field>
          <Field label="مسؤول التنفيذ" className="sm:col-span-2">
            <MemberSelect value={form.assigned_to} onChange={(v) => set("assigned_to", v)} />
          </Field>
          <Field label="ملاحظات تشغيلية" className="sm:col-span-2" hint="تجهيزات، خلفية، طباعة، وقت الوصول، تواصل الموقع...">
            <Textarea rows={4} value={form.operational_notes} onChange={(e) => set("operational_notes", e.target.value)} />
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
