import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/crm/app-shell";
import { MeContext } from "@/components/crm/me-context";
import { BrandMark } from "@/components/crm/brand";
import { meQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    await context.queryClient.ensureQueryData(meQuery(data.user.id));
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const { data } = useQuery(meQuery(user.id));
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (!data) return null;

  if (!data.profile?.is_active || data.roles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <BrandMark />
          </div>
          <ShieldAlert className="mx-auto size-10 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold">لا توجد صلاحية دخول</h1>
          <p className="text-muted-foreground">حسابك غير مفعّل أو لم تُحدد له صلاحية بعد. تواصل مع مدير النظام.</p>
          <Button
            variant="outline"
            onClick={async () => {
              qc.clear();
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
          >
            تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  return (
    <MeContext.Provider value={{ userId: user.id, email: user.email ?? null, profile: data.profile, roles: data.roles }}>
      <AppShell>
        <Outlet />
      </AppShell>
    </MeContext.Provider>
  );
}
