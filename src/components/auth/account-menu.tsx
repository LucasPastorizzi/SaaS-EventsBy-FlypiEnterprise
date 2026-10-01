"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Ticket, User } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { initials, maskPhone } from "@/lib/format";
import { useCustomer, useHydrated, useStore } from "@/lib/store";

/** Topo do site: "Entrar" para visitante; menu da conta para quem está logado. */
export function AccountMenu() {
  const hydrated = useHydrated();
  const customer = useCustomer();
  const router = useRouter();

  if (!hydrated) return <span className="h-9 w-24 rounded-full bg-white/5" aria-hidden />;

  if (!customer)
    return (
      <Link
        href="/entrar"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-3.5 text-sm transition hover:border-white/50 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        <User className="size-4" /> Entrar
      </Link>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Minha conta"
        className="inline-flex h-9 items-center gap-2 rounded-full border border-white/15 pr-3 pl-1 text-sm transition hover:border-white/50 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        <span className="grid size-7 place-items-center rounded-full bg-white text-xs font-bold text-black">{initials(customer.name)}</span>
        <span className="max-w-24 truncate">{customer.name.split(" ")[0]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-1.5 py-1">
          <p className="truncate text-sm font-medium">{customer.name}</p>
          <p className="truncate text-xs text-muted-foreground">{customer.email ?? (customer.phone && maskPhone(customer.phone))}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/minhas-reservas")}>
          <Ticket /> Minhas reservas
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            useStore.getState().signOutCustomer();
            toast("Você saiu da sua conta.");
            router.push("/");
          }}
        >
          <LogOut /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
