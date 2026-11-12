import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleSchema = z.enum(["admin", "manager", "sales", "operations"]);

async function assertAdmin(supabase: { rpc: (...args: never[]) => unknown }, userId: string) {
  const { data, error } = await (supabase as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: boolean | null; error: unknown }>;
  }).rpc("has_any_role", { _user_id: userId, _roles: ["admin"] });
  if (error || !data) throw new Error("هذا الإجراء متاح لمدير النظام فقط.");
}

/** Creates the very first admin account. Refuses once any admin exists. */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(72),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: cErr } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (cErr) throw new Error("تعذر التحقق من حالة النظام.");
    if ((count ?? 0) > 0) throw new Error("تم إعداد حساب المدير مسبقاً. سجّل الدخول بحسابك.");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error || !created.user) throw new Error(error?.message ?? "تعذر إنشاء الحساب.");
    const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "admin" });
    if (rErr) throw new Error("تم إنشاء الحساب لكن تعذر منحه صلاحية المدير.");
    return { ok: true };
  });

export const createTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(255),
        phone: z.string().trim().max(30).optional(),
        password: z.string().min(8).max(72),
        role: roleSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error || !created.user) {
      const msg = error?.message ?? "";
      throw new Error(msg.includes("already") ? "هذا البريد مسجل مسبقاً." : msg || "تعذر إنشاء الحساب.");
    }
    if (data.phone) await supabaseAdmin.from("profiles").update({ phone: data.phone }).eq("id", created.user.id);
    const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: data.role });
    if (rErr) throw new Error("تعذر تعيين الصلاحية.");
    return { id: created.user.id };
  });

export const updateTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        full_name: z.string().trim().min(2).max(100).optional(),
        phone: z.string().trim().max(30).nullable().optional(),
        role: roleSchema.optional(),
        is_active: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    if (data.user_id === context.userId && (data.is_active === false || (data.role && data.role !== "admin"))) {
      throw new Error("لا يمكنك إيقاف حسابك أو إزالة صلاحية المدير عن نفسك.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const profilePatch: Record<string, unknown> = {};
    if (data.full_name !== undefined) profilePatch.full_name = data.full_name;
    if (data.phone !== undefined) profilePatch.phone = data.phone;
    if (data.is_active !== undefined) profilePatch.is_active = data.is_active;
    if (Object.keys(profilePatch).length) {
      const { error } = await supabaseAdmin.from("profiles").update(profilePatch).eq("id", data.user_id);
      if (error) throw new Error("تعذر تحديث بيانات العضو.");
    }
    if (data.role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
      const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.user_id, role: data.role });
      if (error) throw new Error("تعذر تحديث الصلاحية.");
    }
    if (data.is_active !== undefined) {
      await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
        ban_duration: data.is_active ? "none" : "876000h",
      });
    }
    return { ok: true };
  });

export const resetTeamMemberPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ user_id: z.string().uuid(), password: z.string().min(8).max(72) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, { password: data.password });
    if (error) throw new Error("تعذر تغيير كلمة المرور.");
    return { ok: true };
  });
