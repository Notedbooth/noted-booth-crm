import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/crm/page-header";
import { Field } from "@/components/crm/fields";
import { ConfirmDelete } from "@/components/crm/confirm-delete";
import { useMe } from "@/components/crm/me-context";
import { packagesQuery, qk, useDeleteRecord, useSaveRecord } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "الإعدادات — NOTED PHOTO BOOTH" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const me = useMe();
  return (
    <div className="space-y-6">
      <PageHeader title="الإعدادات" description="ملفك الشخصي والباقات وربط موقع الحجز" />
      <ProfileCard />
      {me.can("packages.manage") && <PackagesCard />}
      {me.can("team.manage") && (
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-lg">ربط موقع الحجز الخارجي</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>يمكن لموقع الحجز إرسال الطلبات مباشرة إلى صفحة «طلبات الموقع» عبر الرابط:</p>
            <code className="block rounded-lg bg-muted p-3 text-xs" dir="ltr">POST {typeof window !== "undefined" ? window.location.origin : ""}/api/public/booking-requests</code>
            <p className="text-muted-foreground">مع ترويسة x-api-key تحتوي مفتاح الربط السري (BOOKING_API_KEY). الحقول: full_name، phone، email، event_type، event_date، venue، city، guests، package_name، message، external_ref.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProfileCard() {
  const me = useMe();
  const qc = useQueryClient();
  const [name, setName] = useState(me.profile?.full_name ?? "");
  const [phone, setPhone] = useState(me.profile?.phone ?? "");
  const [pw, setPw] = useState("");
  async function save(e: FormEvent): Promise<unknown> {
    e.preventDefault();
    const { error } = await supabase.from("profiles").update({ full_name: name.trim(), phone: phone || null }).eq("id", me.userId);
    if (error) return toast.error(error.message);
    if (pw) {
      if (pw.length < 8) return toast.error("كلمة المرور 8 أحرف على الأقل");
      const { error: e2 } = await supabase.auth.updateUser({ password: pw });
      if (e2) return toast.error(e2.message);
      setPw("");
    }
    qc.invalidateQueries({ queryKey: qk.me(me.userId) });
    qc.invalidateQueries({ queryKey: qk.team });
    toast.success("تم حفظ الملف الشخصي");
  }
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle className="text-lg">الملف الشخصي</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-3">
          <Field label="الاسم"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="الجوال"><Input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="كلمة مرور جديدة (اختياري)"><Input type="password" dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          <div className="sm:col-span-3"><Button type="submit">حفظ</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

function PackagesCard() {
  const { data = [] } = useQuery(packagesQuery());
  const save = useSaveRecord("packages");
  const del = useDeleteRecord("packages");
  const [form, setForm] = useState({ name: "", duration_hours: "", price: "", description: "" });
  async function add(e: FormEvent): Promise<unknown> {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("اسم الباقة مطلوب");
    const ok = await save.mutateAsync({ values: { name: form.name.trim(), description: form.description || null, duration_hours: form.duration_hours ? Number(form.duration_hours) : null, price: form.price ? Number(form.price) : null, sort_order: data.length } }).catch(() => null);
    if (ok) { setForm({ name: "", duration_hours: "", price: "", description: "" }); toast.success("تمت إضافة الباقة"); }
  }
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle className="text-lg">الباقات</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_2fr_auto] sm:items-end">
          <Field label="اسم الباقة"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="المدة (ساعات)"><Input type="number" min={0} step="0.5" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} /></Field>
          <Field label="السعر"><Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="الوصف"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Button type="submit">إضافة</Button>
        </form>
        {data.length === 0 && <p className="text-sm text-muted-foreground">لا توجد باقات بعد.</p>}
        {data.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
            <div className="min-w-0 flex-1"><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{[p.duration_hours && `${p.duration_hours} ساعات`, p.price != null && fmtMoney(p.price), p.description].filter(Boolean).join(" · ")}</div></div>
            <label className="flex items-center gap-2 text-sm"><Switch checked={p.is_active} onCheckedChange={(c) => save.mutate({ id: p.id, values: { is_active: c } })} />{p.is_active ? "مفعّلة" : "مخفية"}</label>
            <ConfirmDelete onConfirm={() => del.mutate(p.id)} trigger={<Button size="sm" variant="ghost" className="text-destructive">حذف</Button>} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
