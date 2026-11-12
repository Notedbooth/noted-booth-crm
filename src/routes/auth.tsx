import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/crm/brand";
import { bootstrapAdmin } from "@/lib/team.functions";
import { qk } from "@/lib/data";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — NOTED PHOTO BOOTH" },
      { name: "description", content: "تسجيل دخول فريق NOTED PHOTO BOOTH إلى نظام إدارة العملاء." },
      { property: "og:title", content: "تسجيل الدخول — NOTED PHOTO BOOTH" },
      { property: "og:description", content: "تسجيل دخول فريق NOTED PHOTO BOOTH إلى نظام إدارة العملاء." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "forgot";

function AuthPage() {
  const setup = useQuery({
    queryKey: qk.setup,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("setup_required");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute -top-24 -end-24 size-96 rounded-full bg-powder/30 blur-3xl" />
        <div className="absolute bottom-0 start-0 size-[28rem] rounded-full bg-sidebar-accent blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <BrandMark tone="light" />
          <div>
            <h2 className="font-display text-4xl leading-snug font-bold">لحظات تُطبع،<br />وعملاء لا يُنسَون.</h2>
            <p className="mt-4 max-w-sm text-primary-foreground/75">نظام الفريق لإدارة العملاء والحجوزات والمتابعات اليومية.</p>
          </div>
          <div className="text-xs text-primary-foreground/50">NOTED PHOTO BOOTH</div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <BrandMark />
          </div>
          {setup.isLoading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          ) : setup.data ? (
            <SetupForm />
          ) : (
            <SignInForms />
          )}
        </div>
      </div>
    </div>
  );
}

function SignInForms() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid login")
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
          : error.message.includes("banned")
            ? "تم إيقاف هذا الحساب. تواصل مع مدير النظام."
            : error.message,
      );
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function forgot(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("إن كان البريد مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور.");
    setMode("signin");
  }

  if (mode === "forgot") {
    return (
      <form onSubmit={forgot} className="space-y-5">
        <div>
          <h1 className="font-display text-3xl font-bold">استعادة كلمة المرور</h1>
          <p className="mt-2 text-sm text-muted-foreground">أدخل بريدك وسنرسل لك رابط إعادة التعيين.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" className="h-11 w-full" disabled={busy}>
          إرسال الرابط
        </Button>
        <Button type="button" variant="link" className="w-full" onClick={() => setMode("signin")}>
          العودة لتسجيل الدخول
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={signIn} className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">مرحباً بعودتك</h1>
        <p className="mt-2 text-sm text-muted-foreground">سجّل الدخول بحساب الفريق الخاص بك.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" type="email" dir="ltr" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">كلمة المرور</Label>
          <button type="button" className="text-xs text-muted-foreground hover:text-primary" onClick={() => setMode("forgot")}>
            نسيت كلمة المرور؟
          </button>
        </div>
        <Input id="password" type="password" dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="h-11 w-full" disabled={busy}>
        {busy ? "جارٍ الدخول..." : "تسجيل الدخول"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">الحسابات الجديدة يُنشئها مدير النظام من صفحة الفريق.</p>
    </form>
  );
}

function SetupForm() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const bootstrap = useServerFn(bootstrapAdmin);
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) return toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    setBusy(true);
    try {
      await bootstrap({ data: form });
      const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: qk.setup });
      toast.success("تم إنشاء حساب مدير النظام");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">إعداد النظام</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          أنشئ حساب مدير النظام الأول. بعدها يمكنك إضافة أعضاء الفريق وتحديد صلاحياتهم.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="name">الاسم الكامل</Label>
        <Input id="name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" type="email" dir="ltr" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">كلمة المرور</Label>
        <Input id="password" type="password" dir="ltr" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </div>
      <Button type="submit" className="h-11 w-full" disabled={busy}>
        {busy ? "جارٍ الإنشاء..." : "إنشاء حساب المدير"}
      </Button>
    </form>
  );
}
