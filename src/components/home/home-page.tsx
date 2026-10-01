"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, CalendarCheck, ChevronDown, Clock, ListChecks, MapPin, MessageCircle, QrCode, ShieldCheck, Sparkles, Users } from "lucide-react";
import { StringLights } from "@/components/brand";
import { Flyer } from "@/components/flyer";
import { StatusLegend, VenueMap } from "@/components/venue/venue-map";
import { fullDate, time, weekday } from "@/lib/format";
import { statusOf, useHydrated, useStore } from "@/lib/store";

const STEPS = [
  { icon: CalendarCheck, title: "Escolha a noite e o camarote", text: "Veja no mapa do salão e da cobertura quais camarotes estão livres." },
  { icon: ListChecks, title: "Mande seus dados e a lista", text: "Informe quantas pessoas vão e quem são. Dá pra mandar um link para a turma se cadastrar." },
  { icon: QrCode, title: "Receba a confirmação", text: "A equipe do INN confirma pelo WhatsApp e o QR Code de entrada aparece em Minhas reservas." },
];

export function HomePage() {
  useHydrated();
  const venue = useStore((s) => s.venue);
  const events = useStore((s) => s.events);
  const maps = useStore((s) => s.maps);
  const spaces = useStore((s) => s.spaces);
  const reservations = useStore((s) => s.reservations);
  const blocks = useStore((s) => s.blocks);

  const upcoming = events.filter((e) => e.status === "published").sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const camarotes = spaces.filter((s) => s.bookable);
  const next = upcoming[0];
  const freeOf = (eventId: string) => camarotes.filter((s) => statusOf(eventId, s.id, reservations, blocks) === "disponivel").length;

  return (
    <div className="bg-noise">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--wood) 0 2px, transparent 2px 46px)" }}
        />
        <StringLights className="absolute inset-x-0 top-0 -z-10 h-16 w-full opacity-80" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-16 pb-14 md:grid-cols-[1fr_1.05fr] md:pt-24 md:pb-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-wide text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> Reserva oficial de camarotes
            </p>
            <h1 className="mt-5 font-display text-6xl leading-[0.95] md:text-8xl">
              Seu camarote
              <br />
              <span className="text-primary [text-shadow:0_0_40px_color-mix(in_oklch,var(--primary)_55%,transparent)]">no INN</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">{venue.tagline} Escolha o camarote no mapa, mande a lista da sua turma e entre com QR Code.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#noites"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-[0_0_40px_-8px_var(--primary)] transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
              >
                Ver noites disponíveis <ArrowRight className="size-4" />
              </a>
              <a
                href={`https://wa.me/${venue.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass inline-flex h-12 items-center gap-2 rounded-xl px-5 font-medium transition hover:border-white/25"
              >
                <MessageCircle className="size-4" /> Falar com a casa
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" /> {venue.address} · {venue.district}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" /> {venue.hours}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-4" /> +{venue.minAge}
              </span>
            </div>
          </div>

          {next && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative">
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-[var(--violet)]/30 to-[var(--primary)]/15 blur-3xl" />
              <div className="glass rounded-3xl p-3">
                <div className="flex items-center justify-between px-2 pt-1 pb-3">
                  <div>
                    <p className="font-display text-xl">{next.name}</p>
                    <p className="text-xs text-muted-foreground">{fullDate(next.startsAt)} · Salão</p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs text-primary">
                    <span className="size-1.5 animate-pulse rounded-full bg-current" /> ao vivo
                  </span>
                </div>
                <VenueMap map={maps[0]} spaces={spaces.filter((s) => s.mapId === maps[0].id)} statusFor={(s) => statusOf(next.id, s.id, reservations, blocks)} />
                <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-3 pb-1">
                  <StatusLegend />
                  <Link href={`/noite/${next.slug}`} className="text-sm font-semibold text-primary hover:underline">
                    Escolher camarote →
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Noites */}
      <section id="noites" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16">
        <h2 className="font-display text-4xl md:text-5xl">Próximas noites</h2>
        <p className="mt-1 text-muted-foreground">Escolha a noite para ver os camarotes livres.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((ev, i) => {
            const free = freeOf(ev.id);
            return (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Link
                  href={`/noite/${ev.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-white/8 bg-card transition hover:-translate-y-0.5 hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Flyer event={ev} className="aspect-[4/3.3]" />
                  <div className="space-y-3 p-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {weekday(ev.startsAt)} · a partir das {time(ev.startsAt)}
                      </p>
                      <p className="mt-0.5 line-clamp-1">{ev.subtitle}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${free === 0 ? "text-[var(--st-sold)]" : free <= 3 ? "text-[var(--st-hold)]" : "text-primary"}`}>
                        {free === 0 ? "Camarotes esgotados" : free <= 3 ? `Últimos ${free} camarotes` : `${free} camarotes livres`}
                      </p>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold transition group-hover:translate-x-0.5">
                        Reservar <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="font-display text-4xl md:text-5xl">Como funciona</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="glass relative rounded-2xl p-5">
              <span className="absolute top-4 right-5 font-display text-5xl text-white/[0.06]">{i + 1}</span>
              <Icon className="size-6 text-primary" />
              <h3 className="mt-4 font-display text-xl">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Espaços */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="font-display text-4xl md:text-5xl">Os camarotes</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {maps.map((m) => {
            const list = camarotes.filter((s) => s.mapId === m.id);
            if (!list.length) return null;
            const max = Math.max(...list.map((s) => s.capacity));
            return (
              <div
                key={m.id}
                className="relative overflow-hidden rounded-2xl border border-white/8 p-6"
                style={{
                  background:
                    m.id === "m_cobertura"
                      ? "radial-gradient(120% 90% at 100% 0%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 60%), var(--card)"
                      : "radial-gradient(120% 90% at 0% 0%, color-mix(in oklch, var(--violet) 26%, transparent), transparent 60%), var(--card)",
                }}
              >
                <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">{list.length} camarotes</p>
                <h3 className="mt-1 font-display text-4xl">{m.name}</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">{list[0].description}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm">
                  <Users className="size-4 text-primary" /> Para grupos de até {max} pessoas
                </p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {(list[0].perks ?? []).map((p) => (
                    <li key={p} className="rounded-full bg-white/5 px-2.5 py-1 text-xs">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Local + regras + FAQ */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 md:grid-cols-2">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-white/8">
            <iframe
              title={`Mapa: ${venue.address}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(venue.mapsQuery)}&output=embed`}
              className="h-64 w-full grayscale invert-[0.9] hue-rotate-180"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="glass rounded-2xl p-5">
            <h2 className="font-display text-2xl">Regras da casa</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {venue.rules.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" /> {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <h2 className="font-display text-2xl">Perguntas frequentes</h2>
          <div className="mt-3 divide-y divide-white/8 rounded-2xl border border-white/8">
            {venue.faq.map((f) => (
              <details key={f.q} className="group px-4 py-3.5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                  {f.q}
                  <ChevronDown className="size-4 shrink-0 transition group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-white/8 p-4 text-sm">
            <p className="font-medium">Dúvidas sobre o seu camarote?</p>
            <p className="mt-1 text-muted-foreground">Fale com a equipe pelo WhatsApp {venue.phone}.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
