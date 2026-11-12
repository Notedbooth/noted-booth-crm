import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, KanbanSquare, ListChecks, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/crm/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NOTED PHOTO BOOTH — نظام إدارة العملاء والحجوزات" },
      { name: "description", content: "منصة فريق NOTED PHOTO BOOTH لإدارة العملاء والفرص والحجوزات والمتابعات." },
      { property: "og:title", content: "NOTED PHOTO BOOTH — نظام إدارة العملاء والحجوزات" },
      { property: "og:description", content: "منصة فريق NOTED PHOTO BOOTH لإدارة العملاء والفرص والحجوزات والمتابعات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: Users, title: "العملاء", text: "بيانات التواصل وسجل كامل لكل عميل" },
  { icon: KanbanSquare, title: "مسار المبيعات", text: "من أول تواصل حتى إتمام المناسبة" },
  { icon: CalendarDays, title: "الحجوزات", text: "المواعيد والأماكن والملاحظات التشغيلية" },
  { icon: ListChecks, title: "المتابعات", text: "مهام بمواعيد وأولويات لكل الفريق" },
];

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 start-[-10%] size-[520px] rounded-full bg-mist blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 end-[-10%] size-[560px] rounded-full bg-powder/40 blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <BrandMark />
          <Button asChild variant="outline">
            <Link to="/auth">تسجيل الدخول</Link>
          </Button>
        </header>
        <main className="flex flex-1 flex-col justify-center py-16">
          <p className="mb-4 text-sm font-medium tracking-wide text-muted-foreground">منصة الفريق الداخلية</p>
          <h1 className="max-w-3xl font-display text-4xl leading-tight font-bold text-primary md:text-6xl">
            كل عميل، كل مناسبة، وكل متابعة — في مكان واحد.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            نظام إدارة العملاء والعمليات الخاص بفريق NOTED PHOTO BOOTH. تابع الفرص، نظّم الحجوزات، ولا تفوّت أي موعد.
          </p>
          <div className="mt-10">
            <Button asChild size="lg" className="h-12 px-10 text-base">
              <Link to="/auth">الدخول إلى النظام</Link>
            </Button>
          </div>
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border bg-card/80 p-5 shadow-soft backdrop-blur">
                <f.icon className="mb-3 size-6 text-primary" />
                <div className="font-display text-lg font-semibold">{f.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{f.text}</div>
              </div>
            ))}
          </div>
        </main>
        <footer className="text-xs text-muted-foreground">© NOTED PHOTO BOOTH</footer>
      </div>
    </div>
  );
}
