import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  CalendarDays,
  History,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Plus,
  Settings,
  UserCog,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import { initials } from "@/lib/format";
import { primaryRole, type Capability } from "@/lib/permissions";
import { BrandMark } from "./brand";
import { useMe } from "./me-context";
import { CustomerFormDialog } from "./customer-form";
import { LeadFormDialog } from "./lead-form";
import { BookingFormDialog } from "./booking-form";
import { TaskFormDialog } from "./task-form";

type NavItem = {
  to: "/dashboard" | "/customers" | "/pipeline" | "/tasks" | "/bookings" | "/requests" | "/reports" | "/activity" | "/team" | "/settings";
  label: string; icon: typeof Users; cap?: Capability };

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "العمل اليومي",
    items: [
      { to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
      { to: "/customers", label: "العملاء", icon: Users },
      { to: "/pipeline", label: "مسار المبيعات", icon: KanbanSquare },
      { to: "/tasks", label: "المتابعات", icon: ListChecks },
      { to: "/bookings", label: "الحجوزات والمناسبات", icon: CalendarDays },
      { to: "/requests", label: "طلبات الموقع", icon: Inbox, cap: "requests.view" },
    ],
  },
  {
    group: "الإدارة",
    items: [
      { to: "/reports", label: "التقارير", icon: BarChart3, cap: "reports.view" },
      { to: "/activity", label: "سجل النشاط", icon: History, cap: "activity.view" },
      { to: "/team", label: "الفريق والصلاحيات", icon: UserCog, cap: "team.manage" },
      { to: "/settings", label: "الإعدادات", icon: Settings },
    ],
  },
];

function NavList({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const me = useMe();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-6">
      {NAV.map((section) => {
        const items = section.items.filter((i) => !i.cap || me.can(i.cap));
        if (!items.length) return null;
        return (
          <div key={section.group}>
            <div className="mb-2 px-3 text-[11px] font-medium tracking-wide text-sidebar-foreground/50">{section.group}</div>
            <ul className="space-y-1">
              {items.map((item) => {
                const active = pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        active
                          ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="size-4.5 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-5 py-5">
        <BrandMark tone="light" />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <NavList onNavigate={onNavigate} />
      </div>
      <div className="border-t border-sidebar-border px-5 py-4 text-[11px] text-sidebar-foreground/50">
        نظام إدارة العملاء والعمليات
      </div>
    </div>
  );
}

function QuickAdd() {
  const me = useMe();
  const [open, setOpen] = useState<null | "customer" | "lead" | "booking" | "task">(null);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-1.5">
            <Plus />
            <span className="hidden sm:inline">إضافة سريعة</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {me.can("customers.write") && <DropdownMenuItem onSelect={() => setOpen("customer")}>عميل جديد</DropdownMenuItem>}
          {me.can("leads.write") && <DropdownMenuItem onSelect={() => setOpen("lead")}>فرصة بيع جديدة</DropdownMenuItem>}
          {me.can("bookings.write") && <DropdownMenuItem onSelect={() => setOpen("booking")}>حجز جديد</DropdownMenuItem>}
          {me.can("tasks.write") && <DropdownMenuItem onSelect={() => setOpen("task")}>مهمة متابعة</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
      <CustomerFormDialog open={open === "customer"} onOpenChange={(o) => !o && setOpen(null)} />
      <LeadFormDialog open={open === "lead"} onOpenChange={(o) => !o && setOpen(null)} />
      <BookingFormDialog open={open === "booking"} onOpenChange={(o) => !o && setOpen(null)} />
      <TaskFormDialog open={open === "task"} onOpenChange={(o) => !o && setOpen(null)} />
    </>
  );
}

function UserMenu() {
  const me = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = primaryRole(me.roles);
  const name = me.profile?.full_name || me.email || "";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border bg-card py-1 ps-1 pe-3 text-sm shadow-soft hover:bg-muted">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials(name)}
          </span>
          <span className="hidden max-w-32 truncate md:inline">{name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="truncate">{name}</div>
          <div className="text-xs font-normal text-muted-foreground">{role ? ROLE_LABELS[role] : ""}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings /> الإعدادات والملف الشخصي
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={signOut} className="text-destructive focus:text-destructive">
          <LogOut /> تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <SidebarBody />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-72 border-0 p-0 [&>button]:text-sidebar-foreground">
          <SheetTitle className="sr-only">القائمة</SheetTitle>
          <SidebarBody onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="فتح القائمة">
            <Menu />
          </Button>
          <div className="lg:hidden">
            <BrandMark className="scale-90" />
          </div>
          <div className="flex-1" />
          <QuickAdd />
          <UserMenu />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
