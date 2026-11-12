import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader, LoadingBlock } from "@/components/crm/page-header";
import { ActivityFeed } from "@/components/crm/activity-feed";
import { MemberSelect, OptionSelect } from "@/components/crm/fields";
import { useMe } from "@/components/crm/me-context";
import { activityQuery } from "@/lib/data";
import { ENTITY_LABELS } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({ meta: [{ title: "سجل النشاط — NOTED PHOTO BOOTH" }] }),
  component: ActivityPage,
});

function ActivityPage() {
  const me = useMe();
  const [actorId, setActorId] = useState<string | null>(null);
  const [entityType, setEntityType] = useState<string | null>(null);
  const [day, setDay] = useState("");
  const filters = {
    actorId: actorId ?? undefined,
    entityType: entityType ?? undefined,
    from: day ? new Date(day + "T00:00:00").toISOString() : undefined,
    to: day ? new Date(day + "T23:59:59").toISOString() : undefined,
    limit: 300,
  };
  const { data, isLoading } = useQuery(activityQuery(filters));
  if (!me.can("activity.view")) return <p className="py-20 text-center text-muted-foreground">هذه الصفحة متاحة للمدراء فقط.</p>;
  return (
    <div>
      <PageHeader title="سجل النشاط" description="من أنشأ أو عدّل أو حذف السجلات ومتى" />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <MemberSelect value={actorId} onChange={setActorId} />
        <OptionSelect value={entityType} onChange={setEntityType} options={Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label }))} allowNone noneLabel="كل الأنواع" />
        <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
      </div>
      <Card className="p-6 shadow-soft">{isLoading ? <LoadingBlock /> : <ActivityFeed items={data ?? []} />}</Card>
    </div>
  );
}
