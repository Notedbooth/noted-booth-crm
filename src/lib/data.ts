import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { AppRole } from "./constants";

type Tables = Database["public"]["Tables"];
export type Customer = Tables["customers"]["Row"];
export type Lead = Tables["leads"]["Row"];
export type Booking = Tables["bookings"]["Row"];
export type Task = Tables["tasks"]["Row"];
export type Pkg = Tables["packages"]["Row"];
export type Interaction = Tables["customer_interactions"]["Row"];
export type BookingRequest = Tables["booking_requests"]["Row"];
export type Activity = Tables["activity_log"]["Row"];
export type Profile = Tables["profiles"]["Row"];

type Ref = { id: string; full_name: string } | null;

export type LeadWithRefs = Lead & {
  customer: { id: string; full_name: string; phone: string | null } | null;
  package: { id: string; name: string } | null;
  assignee: Ref;
};
export type BookingWithRefs = Booking & {
  customer: { id: string; full_name: string; phone: string | null } | null;
  package: { id: string; name: string } | null;
  assignee: Ref;
};
export type TaskWithRefs = Task & {
  customer: { id: string; full_name: string } | null;
  lead: { id: string; title: string } | null;
  booking: { id: string; booking_number: string } | null;
  assignee: Ref;
};
export type ActivityWithActor = Activity & { actor: Ref };
export type TeamMember = Profile & { roles: AppRole[] };

const PAGE = 1000;

/** Pages through results so lists never silently stop at the API row cap. */
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

const LEAD_SELECT =
  "*, customer:customers(id, full_name, phone), package:packages(id, name), assignee:profiles!leads_assigned_to_fkey(id, full_name)";
const BOOKING_SELECT =
  "*, customer:customers(id, full_name, phone), package:packages(id, name), assignee:profiles!bookings_assigned_to_fkey(id, full_name)";
const TASK_SELECT =
  "*, customer:customers(id, full_name), lead:leads(id, title), booking:bookings(id, booking_number), assignee:profiles!tasks_assigned_to_fkey(id, full_name)";
const ACTIVITY_SELECT = "*, actor:profiles!activity_log_actor_id_fkey(id, full_name)";

export const qk = {
  me: (id: string) => ["me", id] as const,
  customers: ["customers"] as const,
  customer: (id: string) => ["customer", id] as const,
  leads: ["leads"] as const,
  bookings: ["bookings"] as const,
  tasks: ["tasks"] as const,
  packages: ["packages"] as const,
  team: ["team"] as const,
  requests: ["requests"] as const,
  interactions: (customerId: string) => ["interactions", customerId] as const,
  activity: (filters: ActivityFilters) => ["activity", filters] as const,
  setup: ["setup-required"] as const,
};

export const meQuery = (userId: string) =>
  queryOptions({
    queryKey: qk.me(userId),
    queryFn: async () => {
      const [{ data: profile, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      return { profile, roles: (roles ?? []).map((r) => r.role) as AppRole[] };
    },
  });

export const customersQuery = () =>
  queryOptions({
    queryKey: qk.customers,
    queryFn: () =>
      fetchAll<Customer>((from, to) =>
        supabase.from("customers").select("*").order("created_at", { ascending: false }).range(from, to),
      ),
  });

export const customerQuery = (id: string) =>
  queryOptions({
    queryKey: qk.customer(id),
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const leadsQuery = () =>
  queryOptions({
    queryKey: qk.leads,
    queryFn: () =>
      fetchAll<LeadWithRefs>(
        (from, to) =>
          supabase
            .from("leads")
            .select(LEAD_SELECT)
            .order("created_at", { ascending: false })
            .range(from, to) as unknown as PromiseLike<{ data: LeadWithRefs[] | null; error: unknown }>,
      ),
  });

export const bookingsQuery = () =>
  queryOptions({
    queryKey: qk.bookings,
    queryFn: () =>
      fetchAll<BookingWithRefs>(
        (from, to) =>
          supabase
            .from("bookings")
            .select(BOOKING_SELECT)
            .order("event_date", { ascending: true })
            .range(from, to) as unknown as PromiseLike<{ data: BookingWithRefs[] | null; error: unknown }>,
      ),
  });

export const tasksQuery = () =>
  queryOptions({
    queryKey: qk.tasks,
    queryFn: () =>
      fetchAll<TaskWithRefs>(
        (from, to) =>
          supabase
            .from("tasks")
            .select(TASK_SELECT)
            .order("due_date", { ascending: true, nullsFirst: false })
            .range(from, to) as unknown as PromiseLike<{ data: TaskWithRefs[] | null; error: unknown }>,
      ),
  });

export const packagesQuery = () =>
  queryOptions({
    queryKey: qk.packages,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

export const teamQuery = () =>
  queryOptions({
    queryKey: qk.team,
    queryFn: async (): Promise<TeamMember[]> => {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as AppRole),
      }));
    },
  });

export const requestsQuery = () =>
  queryOptions({
    queryKey: qk.requests,
    queryFn: () =>
      fetchAll<BookingRequest>((from, to) =>
        supabase.from("booking_requests").select("*").order("created_at", { ascending: false }).range(from, to),
      ),
  });

export const interactionsQuery = (customerId: string) =>
  queryOptions({
    queryKey: qk.interactions(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_interactions")
        .select("*, author:profiles!customer_interactions_created_by_fkey(id, full_name)")
        .eq("customer_id", customerId)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as (Interaction & { author: Ref })[];
    },
  });

export type ActivityFilters = {
  customerId?: string;
  actorId?: string;
  entityType?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export const activityQuery = (filters: ActivityFilters = {}) =>
  queryOptions({
    queryKey: qk.activity(filters),
    queryFn: async () => {
      let q = supabase.from("activity_log").select(ACTIVITY_SELECT).order("created_at", { ascending: false });
      if (filters.customerId) q = q.eq("customer_id", filters.customerId);
      if (filters.actorId) q = q.eq("actor_id", filters.actorId);
      if (filters.entityType) q = q.eq("entity_type", filters.entityType);
      if (filters.from) q = q.gte("created_at", filters.from);
      if (filters.to) q = q.lte("created_at", filters.to);
      if (filters.limit) {
        const { data, error } = await q.limit(filters.limit);
        if (error) throw error;
        return (data ?? []) as unknown as ActivityWithActor[];
      }
      return fetchAll<ActivityWithActor>(
        (from, to) => q.range(from, to) as unknown as PromiseLike<{ data: ActivityWithActor[] | null; error: unknown }>,
      );
    },
  });

/* ---------------- Mutations ---------------- */

type TableName = "customers" | "leads" | "bookings" | "tasks" | "packages" | "customer_interactions" | "booking_requests";

const INVALIDATE: Record<TableName, readonly (readonly string[])[]> = {
  customers: [qk.customers, ["customer"], qk.leads, qk.bookings, qk.tasks],
  leads: [qk.leads, ["customer"]],
  bookings: [qk.bookings, ["customer"]],
  tasks: [qk.tasks],
  packages: [qk.packages, qk.leads, qk.bookings],
  customer_interactions: [["interactions"]],
  booking_requests: [qk.requests],
};

export function friendlyError(error: unknown): string {
  const msg = (error as { message?: string })?.message ?? String(error);
  const code = (error as { code?: string })?.code;
  if (code === "23503" || msg.includes("foreign key")) return "لا يمكن الحذف لوجود سجلات مرتبطة (مثل حجوزات لهذا العميل).";
  if (code === "42501" || msg.includes("row-level security") || msg.includes("permission"))
    return "ليست لديك صلاحية لتنفيذ هذا الإجراء.";
  if (code === "23505") return "هذا السجل موجود مسبقاً.";
  return msg;
}

export function useSaveRecord<T extends TableName>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string | undefined; values: Tables[T]["Insert"] | Tables[T]["Update"] }) => {
      if (id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from(table) as any)
          .update(values)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as Tables[T]["Row"];
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(table) as any)
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Tables[T]["Row"];
    },
    onSuccess: () => {
      INVALIDATE[table].forEach((key) => qc.invalidateQueries({ queryKey: key }));
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });
}

export function useDeleteRecord(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error, count } = await supabase.from(table).delete({ count: "exact" }).eq("id", id);
      if (error) throw error;
      if (count === 0) throw new Error("ليست لديك صلاحية لحذف هذا السجل.");
    },
    onSuccess: () => {
      INVALIDATE[table].forEach((key) => qc.invalidateQueries({ queryKey: key }));
      qc.invalidateQueries({ queryKey: ["activity"] });
      toast.success("تم الحذف");
    },
    onError: (e) => toast.error(friendlyError(e)),
  });
}
