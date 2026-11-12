import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/crm/page-header";
import { RequestStatusBadge } from "@/components/crm/badges";
import { useMe } from "@/components/crm/me-context";
import { requestsQuery, useSaveRecord, type BookingRequest } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, fmtRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({ meta: [{ title: "طلبات الموقع — NOTED PHOTO BOOTH" }] }),
  component: RequestsPage,
});

function RequestsPage() {
  const me = useMe();
  const { data, isLoading } = useQuery(requestsQuery());
  const saveReq = useSaveRecord("booking_requests");
  const saveCustomer = useSaveRecord("customers");
  const saveLead = useSaveRecord("leads");
  if (!me.can("requests.view")) return <p className="py-20 text-center text-muted-foreground">ليست لديك صلاحية لهذه الصفحة.</p>;

  async function convert(r: BookingRequest) {
    try {
      let customerId: string | null = null;
      if (r.phone) {
        const { data: existing } = await supabase.from("customers").select("id").eq("phone", r.phone).maybeSingle();
        customerId = existing?.id ?? null;
      }
      if (!customerId) {
        const c = await saveCustomer.mutateAsync({ values: { full_name: r.full_name, phone: r.phone, email: r.email, city: r.city, source: "الموقع الإلكتروني" } });
        customerId = c.id;
      }
      const lead = await saveLead.mutateAsync({
        values: { customer_id: customerId, title: `${r.event_type ?? "مناسبة"} — ${r.full_name}`, event_type: r.event_type, event_date: r.event_date, venue: r.venue, guests: r.guests, source: "الموقع الإلكتروني", notes: [r.package_name && `الباقة المطلوبة: ${r.package_name}`, r.message].filter(Boolean).join("\n"), assigned_to: me.userId },
      });
      await saveReq.mutateAsync({ id: r.id, values: { status: "converted", converted_customer_id: customerId, converted_lead_id: lead.id } });
      toast.success("تم تحويل الطلب إلى عميل وفرصة بيع");
    } catch {
      /* errors already shown */
    }
  }

  return (
    <div>
      <PageHeader title="طلبات الموقع" description="طلبات الحجز الواردة من موقع الحجز الخارجي" />
      {isLoading ? <LoadingBlock /> : !data?.length ? (
        <EmptyState icon={<Inbox className="size-5" />} title="لا توجد طلبات بعد" description="عند ربط موقع الحجز ستظهر الطلبات هنا تلقائياً." />
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <Card key={r.id} className="p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{r.full_name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{[r.phone, r.email, r.event_type, r.event_date && fmtDate(r.event_date), r.venue, r.city, r.package_name].filter(Boolean).join(" · ")}</div>
                  {r.message && <p className="mt-2 text-sm whitespace-pre-wrap">{r.message}</p>}
                  <div className="mt-1 text-[11px] text-muted-foreground">{fmtRelative(r.created_at)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <RequestStatusBadge status={r.status} />
                  {r.status === "new" && (
                    <>
                      <Button size="sm" onClick={() => convert(r)}>تحويل إلى فرصة</Button>
                      <Button size="sm" variant="ghost" onClick={() => saveReq.mutate({ id: r.id, values: { status: "rejected" } })}>رفض</Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
