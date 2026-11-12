import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/crm/brand";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "تعيين كلمة مرور جديدة — NOTED PHOTO BOOTH" },
      { name: "description", content: "تعيين كلمة مرور جديدة لحساب الفريق." },
      { property: "og:title", content: "تعيين كلمة مرور جديدة — NOTED PHOTO BOOTH" },
      { property: "og:description", content: "تعيين كلمة مرور جديدة لحساب الفريق." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session && isRecovery) setReady(true);
      else if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    if (password !== confirm) return toast.error("كلمتا المرور غير متطابقتين");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث كلمة المرور");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        <BrandMark />
        {!ready ? (
          <p className="text-sm text-muted-foreground">جارٍ التحقق من الرابط... إذا انتهت صلاحيته اطلب رابطاً جديداً من صفحة تسجيل الدخول.</p>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <h1 className="font-display text-3xl font-bold">كلمة مرور جديدة</h1>
            <div className="space-y-1.5">
              <Label htmlFor="p1">كلمة المرور الجديدة</Label>
              <Input id="p1" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p2">تأكيد كلمة المرور</Label>
              <Input id="p2" type="password" dir="ltr" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              حفظ كلمة المرور
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
