"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Ticket } from "lucide-react";
import { Flyer } from "@/components/flyer";
import { fullDate } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/labels";
import { CustomerLogin } from "@/components/auth/customer-login";
import { useCustomer, useHydrated, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function MyReservations() {
  const hydrated = useHydrated();
  const [now] = useState(() => Date.now());
  const events = useStore((s) => s.events);
  const spaces = useStore((s) => s.spaces);
  const reservations = useStore((s) => s.reservations);
  const customer = useCustomer();

  const mine = reservations
    .filter((r) => !!customer && r.customerId === customer.id && r.status !== "expirada")
    .map((r) => ({ r, ev: events.find((e) => e.id === r.eventId), sp: spaces.find((s) => s.id === r.spaceId) }))
    .filter((x) => x.ev)
    .sort((a, b) => a.ev!.startsAt.localeCompare(b.ev!.startsAt));
  const upcoming = mine.filter((x) => new Date(x.ev!.endsAt).getTime() > now);
  const past = mine.filter((x) => new Date(x.ev!.endsAt).getTime() <= now);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-5xl">Minhas reservas</h1>

      {!hydrated ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-white/5" />
      ) : !customer ? (
        <div className="glass mx-auto mt-6 max-w-sm rounded-3xl p-6">
          <CustomerLogin title="Entre na sua conta" subtitle="Suas reservas e os QR Codes ficam guardados na sua conta." onDone={() => {}} />
        </div>
      ) : mine.length === 0 ? (
        <div className="glass mt-6 rounded-2xl p-8 text-center">
          <Ticket className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">Você ainda não tem reservas</p>
          <p className="mt-1 text-sm text-muted-foreground">Escolha uma noite e garanta o camarote da sua turma.</p>
          <Link href="/#noites" className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Ver noites
          </Link>
        </div>
      ) : (
        [
          { title: "Próximas", list: upcoming },
          { title: "Anteriores", list: past },
        ]
          .filter((g) => g.list.length)
          .map((g) => (
            <section key={g.title} className="mt-6">
              <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground">{g.title}</h2>
              <ul className="space-y-3">
                {g.list.map(({ r, ev, sp }) => (
                  <li key={r.id}>
                    <Link
                      href={r.status === "bloqueio" ? `/noite/${ev!.slug}` : `/reserva/${r.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-white/8 bg-card p-3 transition hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <Flyer event={ev!} size="sm" className="size-16 shrink-0 rounded-xl [&_p]:hidden [&>div]:p-2" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {sp?.label} · {ev!.name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {fullDate(ev!.startsAt)} · {r.partySize} pessoas
                        </p>
                        <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_LABEL[r.status].tone)}>{STATUS_LABEL[r.status].label}</span>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
      )}
    </main>
  );
}
