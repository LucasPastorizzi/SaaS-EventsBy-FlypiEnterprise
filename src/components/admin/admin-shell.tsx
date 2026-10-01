"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, ExternalLink, LayoutDashboard, LogOut, Map, Menu, ScanLine, Settings, Ticket } from "lucide-react";
import { InnLogo } from "@/components/brand";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { StaffGuard } from "@/components/auth/staff-guard";
import { ROLE_LABEL, canAccess } from "@/lib/auth";
import { initials } from "@/lib/format";
import { useStaff, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/painel", label: "Dashboard", icon: LayoutDashboard },
  { href: "/painel/reservas", label: "Reservas", icon: Ticket },
  { href: "/painel/eventos", label: "Noites", icon: CalendarDays },
  { href: "/painel/mapa", label: "Mapa dos camarotes", icon: Map },
  { href: "/painel/configuracoes", label: "Configurações", icon: Settings },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const router = useRouter();
  const staff = useStaff();
  const pending = useStore((s) => s.reservations.filter((r) => r.status === "aguardando").length);
  const items = staff ? NAV.filter((n) => canAccess(staff.role, n.href)) : [];
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-5 pb-1">
        <InnLogo href="/painel" className="text-base" />
      </div>
      <p className="mb-4 px-4 text-xs text-muted-foreground">Painel de reservas</p>
      <nav className="flex-1 space-y-0.5 px-3" aria-label="Painel">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/painel" ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                active ? "bg-primary/15 font-medium text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4", active && "text-primary")} />
              <span className="flex-1">{label}</span>
              {href === "/painel/reservas" && pending > 0 && <span className="rounded-full bg-[var(--st-hold)]/20 px-1.5 text-[11px] font-semibold text-[var(--st-hold)]" aria-label={`${pending} aguardando`}>{pending}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-0.5 border-t border-white/5 p-3">
        <Link href="/portaria" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground">
          <ScanLine className="size-4" /> Modo portaria
        </Link>
        <Link href="/" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground">
          <ExternalLink className="size-4" /> Ver página pública
        </Link>
        {staff && (
          <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-white/[0.04] p-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-black">{initials(staff.name)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{staff.name}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABEL[staff.role]}</p>
            </div>
            <button
              onClick={() => {
                useStore.getState().signOutStaff();
                router.replace("/equipe/entrar");
              }}
              aria-label="Sair"
              title="Sair"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <StaffGuard>
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-white/5 bg-sidebar lg:block">
        <Nav />
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/5 bg-background/80 px-4 backdrop-blur-xl lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="grid size-9 place-items-center rounded-lg hover:bg-white/5">
            <Menu className="size-5" />
          </button>
          <InnLogo href="/painel" className="text-sm" />
        </header>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-64 bg-sidebar p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Nav onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <main className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
    </StaffGuard>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
