"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { CalendarDays, Check, Hourglass, Link2, MapPin, MessageCircle, PartyPopper, Plus, Share2, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flyer } from "@/components/flyer";
import { fullDate, hideCpf, maskCpf } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/labels";
import { CustomerLogin } from "@/components/auth/customer-login";
import { isActive, ticketToken, uid, useCustomer, useHydrated, useStaff, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function Burst() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 32 }, (_, i) => {
        const angle = (i / 32) * Math.PI * 2;
        const dist = 160 + (i % 5) * 50;
        return (
          <motion.span
            key={i}
            className="absolute top-1/3 left-1/2 size-2 rounded-full"
            style={{ background: i % 3 === 0 ? "var(--violet)" : "var(--primary)", boxShadow: "0 0 8px currentColor" }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 200, opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

export function TicketView({ id }: { id: string }) {
  const hydrated = useHydrated();
  const isNew = useSearchParams().get("novo") === "1";
  const r = useStore((s) => s.reservations.find((x) => x.id === id));
  const event = useStore((s) => s.events.find((e) => e.id === r?.eventId));
  const space = useStore((s) => s.spaces.find((x) => x.id === r?.spaceId));
  const venue = useStore((s) => s.venue);
  const { setGuests, cancelReservation } = useStore.getState();
  const [guestName, setGuestName] = useState("");
  const [guestCpf, setGuestCpf] = useState("");
  const [now] = useState(() => Date.now());
  const customer = useCustomer();
  const staff = useStaff();

  if (!hydrated) return <div className="mx-auto mt-20 h-96 max-w-md animate-pulse rounded-3xl bg-white/5" />;
  if (!r || !event || !space)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-display text-3xl">Reserva não encontrada</p>
        <Link href="/minhas-reservas" className="mt-3 inline-block text-primary">
          Ver minhas reservas
        </Link>
      </div>
    );

  // o QR Code é a entrada: só quem fez a reserva (ou a equipe) pode ver
  const allowed = !!staff || (!!customer && r.customerId === customer.id);
  if (!allowed)
    return (
      <div className="mx-auto max-w-sm px-4 py-12">
        {customer ? (
          <div className="glass rounded-3xl p-6 text-center">
            <p className="font-display text-2xl">Esta reserva é de outra conta</p>
            <p className="mt-2 text-sm text-muted-foreground">Entre com a conta que fez a reserva para ver o QR Code.</p>
            <Link href="/minhas-reservas" className="mt-4 inline-block text-sm underline">
              Ver minhas reservas
            </Link>
          </div>
        ) : (
          <div className="glass rounded-3xl p-6">
            <CustomerLogin title="Entre para ver sua reserva" subtitle="Use o mesmo WhatsApp ou e-mail da reserva." onDone={() => {}} />
          </div>
        )}
      </div>
    );

  const st = STATUS_LABEL[r.status];
  const confirmed = r.status === "confirmada" || r.status === "check_in";
  const waiting = r.status === "aguardando";
  const hoursToEvent = (new Date(event.startsAt).getTime() - now) / 3600_000;
  const canCancel = (waiting || r.status === "confirmada") && hoursToEvent > venue.cancelHours;
  const inviteLink = typeof window !== "undefined" ? `${window.location.origin}/convite/${r.code}` : "";

  const addGuest = () => {
    if (!guestName.trim()) return;
    setGuests(r.id, [...r.guests, { id: uid("g_"), name: guestName.trim(), cpfMasked: hideCpf(guestCpf) || undefined }]);
    setGuestName("");
    setGuestCpf("");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      {isNew && <Burst />}
      {isNew && waiting && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 text-center">
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-primary/15 text-primary">
            <Check className="size-7" strokeWidth={3} />
          </div>
          <h1 className="font-display text-4xl">Solicitação enviada!</h1>
          <p className="mt-1 text-sm text-muted-foreground">A equipe do INN vai confirmar no seu WhatsApp, {r.holderPhone}.</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="overflow-hidden rounded-3xl border border-white/10 bg-card shadow-[0_30px_80px_-30px_var(--violet)]"
      >
        <Flyer event={event} className="h-36" />
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-3xl">{space.label}</p>
              <p className="text-sm text-muted-foreground">
                {space.sector} · {r.partySize} pessoas
              </p>
            </div>
            <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", st.tone)}>{waiting ? "Aguardando" : st.label}</span>
          </div>

          <div className="relative -mx-5 flex items-center">
            <span className="absolute -left-3 size-6 rounded-full bg-background" />
            <span className="w-full border-t-2 border-dashed border-white/10" />
            <span className="absolute -right-3 size-6 rounded-full bg-background" />
          </div>

          {confirmed ? (
            <div className="text-center">
              <div className={cn("mx-auto w-fit rounded-2xl bg-white p-3", r.status === "check_in" && "opacity-40")}>
                <QRCodeSVG value={ticketToken(r)} size={208} level="Q" />
              </div>
              <p className="mt-2 font-mono text-sm tracking-widest text-muted-foreground">#{r.code}</p>
              <p className="mt-1 text-xs text-muted-foreground">Mostre este QR Code na entrada. O titular precisa chegar até {venue.arrivalLimit}.</p>
            </div>
          ) : waiting ? (
            <div className="flex gap-3 rounded-xl bg-[var(--st-hold)]/10 p-4 text-sm">
              <Hourglass className="mt-0.5 size-5 shrink-0 text-[var(--st-hold)]" />
              <div>
                <p className="font-semibold">Aguardando a confirmação da casa</p>
                <p className="mt-0.5 text-muted-foreground">O QR Code de entrada aparece aqui assim que o INN confirmar. Normalmente leva poucas horas.</p>
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-white/5 p-4 text-center text-sm text-muted-foreground">Esta reserva não é válida para entrada ({st.label.toLowerCase()}).</p>
          )}

          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" /> {fullDate(event.startsAt)} · {event.name}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" /> {venue.address} · {venue.district}
            </p>
            {r.occasion && (
              <p className="flex items-center gap-2">
                <PartyPopper className="size-4 text-muted-foreground" /> {r.occasion}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {isActive(r) && (
        <section className="glass mt-5 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <Users className="size-4" /> Lista do camarote
            </h2>
            <span className="text-sm text-muted-foreground">
              {r.guests.length}/{r.partySize}
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {r.guests.map((g, i) => (
              <li key={g.id} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2 text-sm">
                <span className="grid size-7 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{g.name}</p>
                  {g.cpfMasked && <p className="font-mono text-xs text-muted-foreground">{g.cpfMasked}</p>}
                </div>
                {i > 0 && (
                  <button aria-label={`Remover ${g.name}`} onClick={() => setGuests(r.id, r.guests.filter((x) => x.id !== g.id))} className="text-muted-foreground hover:text-foreground">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {r.guests.length < r.partySize && (
            <div className="mt-3 space-y-2">
              <Input placeholder="Nome do convidado" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="h-10" aria-label="Nome do convidado" />
              <div className="flex gap-2">
                <Input placeholder="CPF (opcional)" inputMode="numeric" value={guestCpf} onChange={(e) => setGuestCpf(maskCpf(e.target.value))} className="h-10 font-mono" aria-label="CPF do convidado" />
                <Button className="h-10 gap-1" onClick={addGuest} disabled={!guestName.trim()}>
                  <Plus className="size-4" /> Adicionar
                </Button>
              </div>
              <Button
                variant="outline"
                className="h-10 w-full gap-2"
                onClick={() => {
                  navigator.clipboard?.writeText(inviteLink).catch(() => {});
                  toast.success("Link copiado. Mande no grupo para a turma se cadastrar.");
                }}
              >
                <Link2 className="size-4" /> Copiar link para a turma se cadastrar
              </Button>
            </div>
          )}
        </section>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <a
          href={`https://wa.me/${venue.whatsapp}?text=${encodeURIComponent(`Oi! Sobre a minha reserva #${r.code} (${space.label}, ${event.name}).`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm hover:bg-white/5"
        >
          <MessageCircle className="size-4" /> Falar com a casa
        </a>
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => {
            if (navigator.share) navigator.share({ title: event.name, text: `Bora pro ${space.label} no INN!`, url: inviteLink }).catch(() => {});
            else toast.info("Compartilhamento não disponível neste navegador.");
          }}
        >
          <Share2 className="size-4" /> Compartilhar com a turma
        </Button>
        {canCancel && (
          <Button
            variant="ghost"
            className="text-[var(--st-sold)]"
            onClick={() => {
              if (confirm("Cancelar esta reserva? O camarote volta a ficar disponível.")) {
                cancelReservation(r.id);
                toast.success("Reserva cancelada.");
              }
            }}
          >
            Cancelar reserva
          </Button>
        )}
        <Link href="/minhas-reservas" className="py-2 text-center text-sm text-muted-foreground hover:text-foreground">
          Ver todas as minhas reservas
        </Link>
      </div>
    </div>
  );
}
