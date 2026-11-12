import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MoreHorizontal, Phone, Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState, PageHeader } from "@/components/crm/page-header";
import { CustomerFormDialog } from "@/components/crm/customer-form";
import { ConfirmDelete } from "@/components/crm/confirm-delete";
import { OptionSelect } from "@/components/crm/fields";
import { useMe } from "@/components/crm/me-context";
import { bookingsQuery, customersQuery, leadsQuery, useDeleteRecord, type Customer } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/customers/")({
  head: () => ({ meta: [{ title: "العملاء — NOTED PHOTO BOOTH" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(customersQuery()),
      context.queryClient.ensureQueryData(leadsQuery()),
      context.queryClient.ensureQueryData(bookingsQuery()),
    ]),
  component: CustomersPage,
});

function CustomersPage() {
  const me = useMe();
  const navigate = useNavigate();
  const { data: customers } = useSuspenseQuery(customersQuery());
  const { data: leads } = useSuspenseQuery(leadsQuery());
  const { data: bookings } = useSuspenseQuery(bookingsQuery());
  const del = useDeleteRecord("customers");
  const [q, setQ] = useState("");
  const [source, setSource] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const counts = useMemo(() => {
    const m = new Map<string, { leads: number; bookings: number }>();
    for (const l of leads) m.set(l.customer_id, { leads: (m.get(l.customer_id)?.leads ?? 0) + 1, bookings: m.get(l.customer_id)?.bookings ?? 0 });
    for (const b of bookings) m.set(b.customer_id, { leads: m.get(b.customer_id)?.leads ?? 0, bookings: (m.get(b.customer_id)?.bookings ?? 0) + 1 });
    return m;
  }, [leads, bookings]);

  const sources = [...new Set(customers.map((c) => c.source).filter(Boolean))] as string[];
  const cities = [...new Set(customers.map((c) => c.city).filter(Boolean))] as string[];

  const filtered = customers.filter((c) => {
    const term = q.trim().toLowerCase();
    const matches =
      !term ||
      [c.full_name, c.phone, c.whatsapp, c.email, c.company].some((v) => v?.toLowerCase().includes(term));
    return matches && (!source || c.source === source) && (!city || c.city === city);
  });

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="العملاء"
        description={`${customers.length} عميل مسجل`}
        actions={
          me.can("customers.write") && (
            <Button onClick={openNew}>
              <Plus /> عميل جديد
            </Button>
          )
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="ps-9" placeholder="ابحث بالاسم أو الجوال أو البريد..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <OptionSelect value={source} onChange={setSource} options={sources.map((s) => ({ value: s, label: s }))} allowNone noneLabel="كل المصادر" />
        <OptionSelect value={city} onChange={setCity} options={cities.map((s) => ({ value: s, label: s }))} allowNone noneLabel="كل المدن" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title={customers.length ? "لا توجد نتائج مطابقة" : "لا يوجد عملاء بعد"}
          description={customers.length ? "جرّب تغيير البحث أو الفلاتر." : "ابدأ بإضافة أول عميل."}
          action={!customers.length && me.can("customers.write") ? <Button onClick={openNew}>إضافة عميل</Button> : undefined}
        />
      ) : (
        <>
          <Card className="hidden overflow-hidden shadow-soft md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">العميل</TableHead>
                  <TableHead className="text-start">الجوال</TableHead>
                  <TableHead className="text-start">المدينة</TableHead>
                  <TableHead className="text-start">المصدر</TableHead>
                  <TableHead className="text-start">الفرص / الحجوزات</TableHead>
                  <TableHead className="text-start">تاريخ الإضافة</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate({ to: "/customers/$id", params: { id: c.id } })}>
                    <TableCell>
                      <div className="font-medium">{c.full_name}</div>
                      {c.company && <div className="text-xs text-muted-foreground">{c.company}</div>}
                    </TableCell>
                    <TableCell dir="ltr" className="text-end">{c.phone ?? "—"}</TableCell>
                    <TableCell>{c.city ?? "—"}</TableCell>
                    <TableCell>{c.source ?? "—"}</TableCell>
                    <TableCell>
                      {counts.get(c.id)?.leads ?? 0} / {counts.get(c.id)?.bookings ?? 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(c.created_at)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RowMenu
                        canEdit={me.can("customers.write")}
                        canDelete={me.can("records.delete")}
                        onEdit={() => {
                          setEditing(c);
                          setFormOpen(true);
                        }}
                        onDelete={() => del.mutate(c.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="space-y-3 md:hidden">
            {filtered.map((c) => (
              <Card key={c.id} className="p-4 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <Link to="/customers/$id" params={{ id: c.id }} className="min-w-0 flex-1">
                    <div className="font-semibold">{c.full_name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {[c.city, c.source].filter(Boolean).join(" · ") || "—"}
                    </div>
                    <div className="mt-2 text-xs">
                      {counts.get(c.id)?.leads ?? 0} فرص · {counts.get(c.id)?.bookings ?? 0} حجوزات
                    </div>
                  </Link>
                  <div className="flex items-center gap-1">
                    {c.phone && (
                      <Button asChild size="icon" variant="outline">
                        <a href={`tel:${c.phone}`} aria-label="اتصال">
                          <Phone />
                        </a>
                      </Button>
                    )}
                    <RowMenu
                      canEdit={me.can("customers.write")}
                      canDelete={me.can("records.delete")}
                      onEdit={() => {
                        setEditing(c);
                        setFormOpen(true);
                      }}
                      onDelete={() => del.mutate(c.id)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editing} />
    </div>
  );
}

function RowMenu({ canEdit, canDelete, onEdit, onDelete }: { canEdit: boolean; canDelete: boolean; onEdit: () => void; onDelete: () => void }) {
  if (!canEdit && !canDelete) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="خيارات">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && <DropdownMenuItem onSelect={onEdit}>تعديل</DropdownMenuItem>}
        {canDelete && (
          <ConfirmDelete
            description="سيتم حذف العميل وجميع فرصه وسجل التواصل معه. لا يمكن حذف عميل لديه حجوزات."
            onConfirm={onDelete}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                حذف
              </DropdownMenuItem>
            }
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
