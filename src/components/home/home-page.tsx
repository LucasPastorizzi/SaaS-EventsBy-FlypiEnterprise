"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, AtSign, CalendarCheck, ChevronDown, Clock, ListChecks, MapPin, MessageCircle, QrCode, ShieldCheck, Users } from "lucide-react";
import { InnWordmark } from "@/components/brand";
import { Flyer } from "@/components/flyer";
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
    <div>
      {/* Hero: identidade do INN com o logo grande */}
      <section className="relative isolate overflow-hidden">
        {/* preto e branco, como o logo do INN: fundo preto e um facho de luz branco bem suave */}
        <div className="absolute inset-0 -z-10 bg-black" />
        <motion.div
          aria-hidden
          className="absolute -top-56 left-1/2 -z-10 h-[640px] w-[150%] -translate-x-1/2 bg-[conic-gradient(from_180deg_at_50%_0%,transparent_40%,rgb(255_255_255/0.10)_50%,transparent_60%)] blur-2xl"
          animate={{ rotate: [-6, 6, -6] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-b from-transparent to-background" />

        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 pt-20 pb-16 text-center md:pt-28 md:pb-24">
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, ease: "easeOut" }}>
            <InnWordmark className="text-[10.5rem] sm:text-[12rem] md:text-[15rem]" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 max-w-lg text-lg text-white/70 md:text-xl"
          >
            {venue.tagline}
          </motion.p>

          <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/55">
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

          <div className="mt-8 flex items-center gap-2">
            <a
              href="#noites"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-black transition hover:bg-white/85 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none"
            >
              Reservar camarote <ArrowRight className="size-4" />
            </a>
            <a href={`https://instagram.com/${venue.instagram}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram do INN" className="grid size-12 place-items-center rounded-xl border border-white/20 transition hover:border-white/60">
              <AtSign className="size-5" />
            </a>
            <a href={`https://wa.me/${venue.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp do INN" className="grid size-12 place-items-center rounded-xl border border-white/20 transition hover:border-white/60">
              <MessageCircle className="size-5" />
            </a>
          </div>

          {next && (
            <Link
              href={`/noite/${next.slug}`}
              className="mt-6 inline-flex items-center gap-2.5 rounded-2xl border border-white/15 px-4 py-2 text-left text-sm transition hover:border-white/50"
            >
              <span className="size-2 shrink-0 animate-pulse rounded-full bg-white" />
              <span>
                <span className="block text-xs text-muted-foreground">Próxima noite</span>
                <span className="font-medium">{next.name}</span>
                <span className="text-muted-foreground"> · {fullDate(next.startsAt)}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
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
