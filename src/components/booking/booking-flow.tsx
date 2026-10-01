"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Clock, Plus, Radio, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Flyer } from "@/components/flyer";
import { StatusLegend, VenueMap } from "@/components/venue/venue-map";
import { countdown, fullDate, hideCpf, maskCpf, maskPhone } from "@/lib/format";
import { statusOf, uid, useHydrated, useStore } from "@/lib/store";
import type { Guest, Space } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SpacePanel } from "./space-panel";

type Step = "camarote" | "dados" | "lista" | "revisao";
const STEPS: { key: Step; label: string }[] = [
  { key: "camarote", label: "Camarote" },
  { key: "dados", label: "Seus dados" },
  { key: "lista", label: "Convidados" },
  { key: "revisao", label: "Enviar" },
];
const OCCASIONS = ["Só curtir", "Aniversário", "Despedida", "Confraternização", "Outro"];

interface Draft {
  name: string;
  phone: string;
  email: string;
  occasion: string;
  notes: string;
  terms: boolean;
  marketing: boolean;
  guests: Guest[];
}
const emptyDraft: Draft = { name: "", phone: "", email: "", occasion: "Só curtir", notes: "", terms: false, marketing: false, guests: [] };

const dadosValid = (d: Draft) => d.name.trim().length > 2 && d.phone.replace(/\D/g, "").length >= 10 && /\S+@\S+\.\S+/.test(d.email) && d.terms;

export function BookingFlow({ eventSlug }: { eventSlug: string }) {
  const hydrated = useHydrated();
  const router = useRouter();

  const venue = useStore((s) => s.venue);
  const event = useStore((s) => s.events.find((e) => e.slug === eventSlug));
  const maps = useStore((s) => s.maps);
  const allSpaces = useStore((s) => s.spaces);
  const reservations = useStore((s) => s.reservations);
  const blocks = useStore((s) => s.blocks);
  const { createHold, releaseHold, submitRequest, expireHolds, simulateActivity } = useStore.getState();

  const [mapId, setMapId] = useState(maps[0]?.id);
  const [selected, setSelected] = useState<Space | null>(null);
  const [party, setParty] = useState(8);
  const [step, setStep] = useState<Step>("camarote");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [guestName, setGuestName] = useState("");
  const [guestCpf, setGuestCpf] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const hold = reservations.find((r) => r.mine && r.eventId === event?.id && r.status === "bloqueio");
  const holdSpace = hold ? allSpaces.find((s) => s.id === hold.spaceId) : undefined;
  const msLeft = hold?.holdExpiresAt ? new Date(hold.holdExpiresAt).getTime() - now : 0;

  const map = maps.find((m) => m.id === mapId) ?? maps[0];
  const spaces = useMemo(() => allSpaces.filter((s) => s.mapId === map?.id), [allSpaces, map?.id]);

  // relógio do bloqueio + expiração
  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now());
      const expired = expireHolds();
      if (hold && expired.includes(hold.id)) {
        toast.error("O tempo acabou e o camarote foi liberado. Escolha de novo.");
        setStep("camarote");
      }
    }, 1000);
    return () => clearInterval(t);
  }, [expireHolds, hold]);

  // cada etapa começa do topo (no celular a página costuma estar rolada)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // "Ao vivo": outras pessoas reservando enquanto o cliente olha o mapa
  useEffect(() => {
    if (!event || step !== "camarote") return;
    const t = setInterval(() => {
      const r = simulateActivity(event.id, selected?.id ?? hold?.spaceId);
      if (r) toast(r.status === "reservado" ? `${r.label} acabou de ser confirmado` : `Alguém está reservando o ${r.label}`, { icon: <Radio className="size-4 text-[var(--st-hold)]" />, duration: 2500 });
    }, 12_000);
    return () => clearInterval(t);
  }, [event, step, selected?.id, hold?.spaceId, simulateActivity]);

  if (!event) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-display text-3xl">Noite não encontrada</p>
        <Link href="/#noites" className="mt-4 inline-block text-primary underline-offset-4 hover:underline">
          Ver próximas noites
        </Link>
      </div>
    );
  }

  const statusFor = (s: Space) => statusOf(event.id, s.id, reservations, blocks, now);
  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const partySize = Math.min(party, holdSpace?.capacity ?? party);

  const reserve = () => {
    if (!selected) return;
    if (hold?.spaceId === selected.id) {
      setStep("dados");
      setSelected(null);
      return;
    }
    const res = createHold(event.id, selected.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setStep("dados");
    setSelected(null);
  };

  const next = () => {
    if (step === "dados" && !dadosValid(draft)) {
      toast.error("Preencha nome, WhatsApp, e-mail e aceite os termos.");
      return;
    }
    setStep(STEPS[stepIdx + 1].key);
  };

  const send = () => {
    if (!hold) return;
    const holder: Guest = { id: uid("g_"), name: draft.name.trim() };
    const r = submitRequest(hold.id, {
      holderName: draft.name.trim(),
      holderPhone: draft.phone,
      holderEmail: draft.email.trim(),
      partySize,
      occasion: draft.occasion === "Só curtir" ? undefined : draft.occasion,
      notes: draft.notes.trim() || undefined,
      guests: [holder, ...draft.guests],
    });
    if (r) {
      toast.success("Solicitação enviada! A casa vai confirmar pelo WhatsApp.");
      router.push(`/reserva/${r.id}?novo=1`);
    }
  };

  const addGuest = () => {
    if (!guestName.trim()) return;
    setDraft({ ...draft, guests: [...draft.guests, { id: uid("g_"), name: guestName.trim(), cpfMasked: hideCpf(guestCpf) || undefined }] });
    setGuestName("");
    setGuestCpf("");
  };

  const cancelHold = () => {
    if (hold) releaseHold(hold.id);
    setStep("camarote");
    toast("Camarote liberado.");
  };

  const back = () => setStep(STEPS[stepIdx - 1].key);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 pb-40 md:pb-16">
      {/* topo da noite */}
      <div className="flex items-center gap-3">
        <Link href="/#noites" aria-label="Voltar" className="glass grid size-10 shrink-0 place-items-center rounded-xl">
          <ArrowLeft className="size-4" />
        </Link>
        <Flyer event={event} size="sm" className="hidden size-14 shrink-0 rounded-xl sm:block [&_p]:hidden [&>div>div:first-child]:hidden" />
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl md:text-3xl">{event.name}</h1>
          <p className="truncate text-sm text-muted-foreground">
            {fullDate(event.startsAt)} · {event.subtitle}
          </p>
        </div>
      </div>

      {/* barra do bloqueio */}
      <AnimatePresence>
        {hold && hydrated && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "sticky top-[4.5rem] z-30 mt-4 flex items-center gap-3 rounded-xl border px-3 py-2.5 backdrop-blur-xl",
              msLeft < 120_000 ? "border-[var(--st-sold)]/50 bg-[var(--st-sold)]/15" : "border-[var(--violet)]/50 bg-[var(--violet)]/15",
            )}
            role="status"
          >
            <Clock className="size-4 shrink-0" />
            <p className="flex-1 text-sm">
              <span className="font-semibold">{holdSpace?.label}</span> separado para você por <span className="font-mono font-bold tabular-nums">{countdown(msLeft)}</span>
            </p>
            <Button size="sm" variant="ghost" onClick={cancelHold} className="gap-1">
              <X className="size-3.5" /> Liberar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* etapas */}
      <ol className="mt-5 flex gap-1.5" aria-label="Etapas da reserva">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex-1">
            <div className={cn("h-1 rounded-full transition-colors", i <= stepIdx ? "bg-primary" : "bg-white/10")} />
            <p className={cn("mt-1.5 text-[11px] sm:text-xs", i === stepIdx ? "font-semibold text-foreground" : "text-muted-foreground")} aria-current={i === stepIdx ? "step" : undefined}>
              {s.label}
            </p>
          </li>
        ))}
      </ol>

      {step === "camarote" ? (
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="mb-3 flex gap-2" role="tablist" aria-label="Ambiente">
              {maps.map((m) => (
                <Button key={m.id} role="tab" aria-selected={m.id === map.id} size="sm" variant={m.id === map.id ? "default" : "outline"} onClick={() => setMapId(m.id)}>
                  {m.name}
                </Button>
              ))}
            </div>
            <VenueMap
              map={map}
              spaces={spaces}
              statusFor={statusFor}
              selectedId={selected?.id}
              mineId={hold?.spaceId}
              onSelect={(s) => {
                setSelected(s);
                setParty((p) => Math.min(Math.max(p, 1), s.capacity));
              }}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <StatusLegend />
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" /> atualizando ao vivo
              </p>
            </div>
          </div>

          {/* painel lateral (desktop) */}
          <aside className="hidden md:block">
            <div className="glass sticky top-36 rounded-2xl p-4">
              {selected ? (
                <SpacePanel space={selected} status={statusFor(selected)} party={party} setParty={setParty} onReserve={reserve} isMine={hold?.spaceId === selected.id} />
              ) : (
                <div className="py-10 text-center">
                  <p className="font-display text-2xl">Escolha seu camarote</p>
                  <p className="mt-1 text-sm text-muted-foreground">Toque em um camarote verde no mapa. Use as abas para ver o salão e a cobertura.</p>
                  {hold && (
                    <Button className="mt-4" onClick={() => setStep("dados")}>
                      Continuar com {holdSpace?.label}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* bottom sheet (mobile) */}
          <AnimatePresence>
            {selected && (
              <motion.div
                key="sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 100) setSelected(null);
                }}
                className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl md:hidden"
              >
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
                <button onClick={() => setSelected(null)} aria-label="Fechar" className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-white/10">
                  <X className="size-4" />
                </button>
                <SpacePanel space={selected} status={statusFor(selected)} party={party} setParty={setParty} onReserve={reserve} isMine={hold?.spaceId === selected.id} />
              </motion.div>
            )}
          </AnimatePresence>
          {!selected && hold && (
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
              <Button className="h-12 w-full text-base" onClick={() => setStep("dados")}>
                Continuar com {holdSpace?.label}
              </Button>
            </div>
          )}
        </div>
      ) : hold && holdSpace ? (
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_320px]">
          <motion.section key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="glass min-w-0 rounded-2xl p-4 md:p-6">
            {step === "dados" && (
              <div className="space-y-4">
                <h2 className="font-display text-3xl">Quem é o titular?</h2>
                <p className="-mt-2 text-sm text-muted-foreground">A confirmação chega no seu WhatsApp.</p>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" autoComplete="name" className="h-11" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">WhatsApp</Label>
                    <Input id="phone" inputMode="tel" autoComplete="tel" className="h-11" placeholder="(51) 90000-0000" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: maskPhone(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" autoComplete="email" className="h-11" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
                  </div>
                </div>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">É uma ocasião especial?</legend>
                  <div className="flex flex-wrap gap-2">
                    {OCCASIONS.map((o) => (
                      <button
                        key={o}
                        type="button"
                        aria-pressed={draft.occasion === o}
                        onClick={() => setDraft({ ...draft, occasion: o })}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          draft.occasion === o ? "border-primary bg-primary/15 text-foreground" : "border-white/10 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Recado para a casa (opcional)</Label>
                  <Textarea id="notes" rows={2} placeholder="Ex.: vamos chegar por volta das 23h, é aniversário da Ana." value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
                </div>
                <label className="flex items-start gap-2.5 text-sm">
                  <Checkbox checked={draft.terms} onCheckedChange={(v) => setDraft({ ...draft, terms: !!v })} className="mt-0.5" />
                  <span>
                    Li e aceito as regras da casa e a <a className="underline">política de privacidade</a>.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Checkbox checked={draft.marketing} onCheckedChange={(v) => setDraft({ ...draft, marketing: !!v })} className="mt-0.5" />
                  <span>Quero receber a programação do INN pelo WhatsApp (opcional).</span>
                </label>
              </div>
            )}

            {step === "lista" && (
              <div className="space-y-4">
                <h2 className="font-display text-3xl">Lista do camarote</h2>
                <p className="-mt-2 text-sm text-muted-foreground">
                  Adicione quem vai com você. Pode completar depois ou mandar um link para cada um se cadastrar.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2 text-sm">
                    <span className="grid size-7 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</span>
                    <span className="flex-1 font-medium">{draft.name}</span>
                    <span className="text-xs text-muted-foreground">Titular</span>
                  </li>
                  {draft.guests.map((g, i) => (
                    <li key={g.id} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2 text-sm">
                      <span className="grid size-7 place-items-center rounded-full bg-white/10 text-xs font-bold">{i + 2}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{g.name}</p>
                        {g.cpfMasked && <p className="font-mono text-xs text-muted-foreground">{g.cpfMasked}</p>}
                      </div>
                      <button aria-label={`Remover ${g.name}`} onClick={() => setDraft({ ...draft, guests: draft.guests.filter((x) => x.id !== g.id) })} className="text-muted-foreground hover:text-foreground">
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                {draft.guests.length + 1 < partySize ? (
                  <form
                    className="space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      addGuest();
                    }}
                  >
                    <Input placeholder="Nome do convidado" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="h-11" aria-label="Nome do convidado" />
                    <div className="flex gap-2">
                      <Input placeholder="CPF (opcional)" inputMode="numeric" value={guestCpf} onChange={(e) => setGuestCpf(maskCpf(e.target.value))} className="h-11 font-mono" aria-label="CPF do convidado" />
                      <Button type="submit" className="h-11 gap-1" disabled={!guestName.trim()}>
                        <Plus className="size-4" /> Adicionar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="text-sm text-primary">Lista completa para {partySize} pessoas.</p>
                )}
                <p className="text-xs text-muted-foreground">O CPF é guardado com segurança e aparece mascarado para a equipe da portaria.</p>
              </div>
            )}

            {step === "revisao" && (
              <div className="space-y-4">
                <h2 className="font-display text-3xl">Confira e envie</h2>
                <dl className="divide-y divide-white/5 rounded-xl border border-white/8 text-sm">
                  {[
                    ["Noite", `${event.name} · ${fullDate(event.startsAt)}`],
                    ["Camarote", `${holdSpace.label} · ${holdSpace.sector}`],
                    ["Pessoas", `${partySize}`],
                    ["Titular", `${draft.name} · ${draft.phone}`],
                    ["Ocasião", draft.occasion],
                    ["Lista", `${draft.guests.length + 1} de ${partySize} nomes`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 px-3 py-2.5">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="rounded-xl bg-[var(--violet)]/10 p-3 text-sm">
                  A equipe do INN analisa a solicitação e confirma pelo WhatsApp. O QR Code de entrada aparece em <strong>Minhas reservas</strong> assim que for confirmado. O titular precisa chegar até {venue.arrivalLimit}.
                </p>
                <Button className="hidden h-12 w-full text-base font-semibold md:flex" onClick={send}>
                  Enviar solicitação de reserva
                </Button>
              </div>
            )}

            <div className="mt-6 hidden gap-2 md:flex">
              <Button variant="outline" className="h-11" onClick={back}>
                Voltar
              </Button>
              {step !== "revisao" && (
                <Button className="h-11 flex-1" onClick={next}>
                  Continuar
                </Button>
              )}
            </div>
          </motion.section>

          <aside>
            <div className="glass overflow-hidden rounded-2xl md:sticky md:top-36">
              <Flyer event={event} size="sm" className="h-28" />
              <div className="space-y-1 p-4 text-sm">
                <p className="font-display text-2xl">{holdSpace.label}</p>
                <p className="text-muted-foreground">{holdSpace.sector}</p>
                <p>
                  {partySize} {partySize === 1 ? "pessoa" : "pessoas"} · até {holdSpace.capacity}
                </p>
              </div>
            </div>
          </aside>

          <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-white/10 bg-background/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
            <Button variant="outline" className="h-12" onClick={back}>
              Voltar
            </Button>
            <Button className="h-12 flex-1 text-base" onClick={step === "revisao" ? send : next}>
              {step === "revisao" ? "Enviar solicitação" : "Continuar"}
            </Button>
          </div>
        </div>
      ) : (
        hydrated && (
          <div className="glass mt-6 rounded-2xl p-6 text-center">
            <p>O tempo para separar o camarote acabou.</p>
            <Button className="mt-3" onClick={() => setStep("camarote")}>
              Escolher camarote
            </Button>
          </div>
        )
      )}
    </div>
  );
}
