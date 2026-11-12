import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, LoadingBlock } from "@/components/crm/page-header";
import { Field, OptionSelect } from "@/components/crm/fields";
import { useMe } from "@/components/crm/me-context";
import { qk, teamQuery } from "@/lib/data";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type AppRole } from "@/lib/constants";
import { createTeamMember, resetTeamMemberPassword, updateTeamMember } from "@/lib/team.functions";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({ meta: [{ title: "الفريق والصلاحيات — NOTED PHOTO BOOTH" }] }),
  component: TeamPage,
});

const ROLES: AppRole[] = ["admin", "manager", "sales", "operations"];
const roleOptions = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

function TeamPage() {
  const me = useMe();
  const qc = useQueryClient();
  const { data: team, isLoading } = useQuery(teamQuery());
  const update = useServerFn(updateTeamMember);
  const resetPw = useServerFn(resetTeamMemberPassword);
  const [open, setOpen] = useState(false);
  if (!me.can("team.manage")) return <p className="py-20 text-center text-muted-foreground">هذه الصفحة متاحة لمدير النظام فقط.</p>;

  async function run(fn: () => Promise<unknown>, msg: string) {
    try {
      await fn();
      toast.success(msg);
      qc.invalidateQueries({ queryKey: qk.team });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader title="الفريق والصلاحيات" description="أضف أعضاء الفريق وحدد صلاحياتهم" actions={<Button onClick={() => setOpen(true)}><Plus /> عضو جديد</Button>} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((r) => (
          <Card key={r} className="p-4 shadow-soft"><div className="font-semibold">{ROLE_LABELS[r]}</div><div className="mt-1 text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[r]}</div></Card>
        ))}
      </div>
      {isLoading ? <LoadingBlock /> : (
        <div className="space-y-3">
          {(team ?? []).map((m) => (
            <Card key={m.id} className="flex flex-col gap-3 p-4 shadow-soft md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{m.full_name}{m.id === me.userId && " (أنت)"}</div>
                <div className="text-xs text-muted-foreground" dir="ltr">{m.email}</div>
              </div>
              <div className="w-44">
                <OptionSelect value={m.roles[0] ?? null} onChange={(v) => v && run(() => update({ data: { user_id: m.id, role: v as AppRole } }), "تم تحديث الصلاحية")} options={roleOptions} placeholder="بدون صلاحية" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={m.is_active} disabled={m.id === me.userId} onCheckedChange={(c) => run(() => update({ data: { user_id: m.id, is_active: c } }), c ? "تم تفعيل الحساب" : "تم إيقاف الحساب")} />
                {m.is_active ? "مفعّل" : "موقوف"}
              </label>
              <Button size="sm" variant="outline" onClick={() => {
                const pw = window.prompt("كلمة المرور الجديدة (8 أحرف على الأقل)");
                if (pw && pw.length >= 8) run(() => resetPw({ data: { user_id: m.id, password: pw } }), "تم تغيير كلمة المرور");
                else if (pw) toast.error("كلمة المرور قصيرة");
              }}>تغيير كلمة المرور</Button>
            </Card>
          ))}
        </div>
      )}
      <NewMemberDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function NewMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const create = useServerFn(createTeamMember);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", role: "sales" as AppRole });
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("كلمة المرور 8 أحرف على الأقل"); return; }
    setBusy(true);
    try {
      await create({ data: { ...form, phone: form.phone || undefined } });
      toast.success("تمت إضافة العضو. شارك معه البريد وكلمة المرور.");
      qc.invalidateQueries({ queryKey: qk.team });
      setForm({ full_name: "", email: "", phone: "", password: "", role: "sales" });
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>عضو فريق جديد</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="الاسم الكامل" required><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></Field>
          <Field label="البريد الإلكتروني" required><Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="الجوال"><Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="كلمة المرور المبدئية" required><Input type="text" dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
          <Field label="الصلاحية"><OptionSelect value={form.role} onChange={(v) => v && setForm({ ...form, role: v as AppRole })} options={roleOptions} /></Field>
          <DialogFooter><Button type="submit" disabled={busy}>{busy ? "جارٍ الإنشاء..." : "إنشاء الحساب"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
