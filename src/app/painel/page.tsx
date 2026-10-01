"use client";

import Link from "next/link";
import { Check, PartyPopper, Repeat2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { ReservationsChart } from "@/components/admin/charts";
import { Button } from "@/components/ui/button";
import { seeded } from "@/lib/mock-data";
import { dayMonth, initials } from "@/lib/format";
import { isActive, isConfirmed, useStore } from "@/lib/store";

/** Camarotes reservados por dia nos últimos 30 dias (demo): picos na sexta e no sábado. */
function series() {
  const rand = seeded("reservas");
  const out: { label: string; value: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000);
    const wd = d.getUTCDay();
    const base = wd === 5 ? 9 : wd === 6 ? 12 : wd === 4 ? 2 : 0.6;
    out.push({ label: dayMonth(d.toISOString()), value: Math.round(base * (0.7 + rand() * 0.6)) });
  }
  return out;
}
const SERIES_DATA = series();

const FREQUENT = [
  { name: "Mariana Becker", visits: 11 },
  { name: "Eduardo Kunz", visits: 9 },
  { name: "Larissa Weber", visits: 8 },
  { name: "Igor Schmidt", visits: 6 },
  { name: "Camila Müller", visits: 5 },
];

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-display text-3xl tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const events = useStore((s) => s.events);
  const spaces = useStore((s) => s.spaces);
  const reservations = useStore((s) => s.reservations);
  const { decide } = useStore.getState();

  const camarotes = spaces.filter((s) => s.bookable);
  const upcoming = events.filter((e) => e.status === "published").sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const upcomingIds = new Set(upcoming.map((e) => e.id));
  const pending = reservations.filter((r) => r.status === "aguardando").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const confirmedNext = reservations.filter((r) => upcomingIds.has(r.eventId) && isConfirmed(r));
  const people = confirmedNext.reduce((a, r) => a + r.partySize, 0);
  const monthTotal = SERIES_DATA.reduce((a, d) => a + d.value, 0);

  const occupancy = upcoming.map((e) => {
    const taken = reservations.filter((r) => r.eventId === e.id && isActive(r)).length;
    const conf = reservations.filter((r) => r.eventId === e.id && isConfirmed(r));
    return { e, taken, pct: Math.round((taken / camarotes.length) * 100), people: conf.reduce((a, r) => a + r.partySize, 0) };
  });

  return (
    <>
      <PageHeader title="Dashboard" description="Camarotes, solicitações e quem está vindo nas próximas noites." />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Aguardando confirmação" value={String(pending.length)} hint="solicitações para responder" />
        <Kpi label="Camarotes confirmados" value={String(confirmedNext.length)} hint="nas próximas noites" />
        <Kpi label="Pessoas esperadas" value={String(people)} hint="somando as listas confirmadas" />
        <Kpi label="Reservas em 30 dias" value={String(monthTotal)} hint="no-show de 4% no período" />
      </div>

      <section className="mt-4 rounded-2xl border border-white/8 bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Solicitações para responder</h2>
          <Link href="/painel/reservas" className="text-xs text-muted-foreground hover:text-foreground">
            Ver todas
          </Link>
        </div>
        {pending.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma solicitação pendente. 🎉</p>
        ) : (
          <ul className="mt-2 divide-y divide-white/5">
            {pending.slice(0, 6).map((r) => {
              const ev = events.find((e) => e.id === r.eventId);
              const sp = spaces.find((s) => s.id === r.spaceId);
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                  <span className="grid size-9 place-items-center rounded-full bg-white/8 text-xs font-semibold">{initials(r.holderName || "?")}</span>
                  <div className="min-w-40 flex-1">
                    <p className="font-medium">{r.holderName}</p>
                    <p className="text-xs text-muted-foreground">
                      {sp?.label} · {ev?.name} · {ev && dayMonth(ev.startsAt)} · {r.partySize} pessoas
                    </p>
                  </div>
                  {r.occasion && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--violet)]/15 px-2 py-0.5 text-xs">
                      <PartyPopper className="size-3" /> {r.occasion}
                    </span>
                  )}
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => {
                        decide(r.id, false);
                        toast(`Solicitação de ${r.holderName.split(" ")[0]} recusada. O camarote foi liberado.`);
                      }}
                    >
                      <X className="size-3.5" /> Recusar
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        decide(r.id, true);
                        toast.success(`${sp?.label} confirmado para ${r.holderName.split(" ")[0]}. QR liberado.`);
                      }}
                    >
                      <Check className="size-3.5" /> Confirmar
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-white/8 bg-card p-4 xl:col-span-2">
          <h2 className="font-semibold">Camarotes reservados por dia</h2>
          <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          <div className="mt-3">
            <ReservationsChart data={SERIES_DATA} />
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-card p-4">
          <h2 className="font-semibold">Ocupação das próximas noites</h2>
          <ul className="mt-4 space-y-4">
            {occupancy.map(({ e, taken, pct, people }) => (
              <li key={e.id}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{e.name}</span>
                  <span className="font-semibold tabular-nums">
                    {taken}/{camarotes.length}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/8" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Ocupação ${e.name}`}>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dayMonth(e.startsAt)} · {pct}% dos camarotes · {people} pessoas confirmadas
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-white/8 bg-card p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <Repeat2 className="size-4 text-primary" /> Clientes que mais voltam
        </h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {FREQUENT.map((c, i) => (
            <li key={c.name} className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-2.5 text-sm">
              <span className="grid size-8 place-items-center rounded-full bg-white/8 text-xs font-semibold">{initials(c.name)}</span>
              <div className="min-w-0">
                <p className="truncate">
                  {i + 1}. {c.name}
                </p>
                <p className="text-xs text-muted-foreground">{c.visits} camarotes</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
