"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ArrowLeft, Camera, CameraOff, CheckCircle2, LogOut, QrCode, Search, Wifi, WifiOff, XCircle } from "lucide-react";
import { StaffGuard } from "@/components/auth/staff-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { time } from "@/lib/format";
import { isConfirmed, ticketToken, useHydrated, useStaff, useStore, type CheckinResult } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BRAND } from "@/brand";

const Scanner = dynamic(() => import("@yudiel/react-qr-scanner").then((m) => m.Scanner), { ssr: false });

function ResultOverlay({ result, onClose }: { result: CheckinResult; onClose: () => void }) {
  useEffect(() => {
    navigator.vibrate?.(result.kind === "valid" ? 80 : [60, 60, 60]);
    const t = setTimeout(onClose, result.kind === "valid" ? 3200 : 5000);
    return () => clearTimeout(t);
  }, [result, onClose]);

  const cfg = {
    valid: { bg: "bg-[oklch(0.5_0.16_150)]", icon: CheckCircle2, title: "Entrada liberada" },
    already_used: { bg: "bg-[oklch(0.62_0.15_75)]", icon: AlertTriangle, title: "QR já utilizado" },
    not_confirmed: { bg: "bg-[oklch(0.62_0.15_75)]", icon: AlertTriangle, title: "Reserva não confirmada" },
    invalid: { bg: "bg-[oklch(0.5_0.2_25)]", icon: XCircle, title: "Ingresso inválido" },
  }[result.kind];
  const Icon = cfg.icon;
  const r = "reservation" in result ? result.reservation : undefined;
  const space = "space" in result ? result.space : undefined;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className={cn("fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-8 text-center text-white", cfg.bg)}
      role="alert"
      aria-label={`${cfg.title}. Toque para continuar.`}
    >
      <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14 }}>
        <Icon className="size-28" strokeWidth={2.2} />
      </motion.div>
      <p className="font-display text-4xl font-extrabold">{cfg.title}</p>
      {r && (
        <div className="space-y-1">
          <p className="text-2xl font-semibold">{r.holderName}</p>
          <p className="text-xl">
            {space?.label} · {r.partySize} pessoas
          </p>
          {result.kind === "already_used" && r.checkedInAt && <p className="text-lg opacity-90">Entrou às {time(r.checkedInAt)}</p>}
          {result.kind === "valid" && <p className="mt-3 rounded-xl bg-black/25 px-4 py-2 text-lg font-semibold">{r.guests.length} nomes na lista</p>}
        </div>
      )}
      {result.kind === "invalid" && <p className="text-xl">{result.reason}</p>}
      <p className="absolute bottom-8 text-sm opacity-80">Toque para ler o próximo</p>
    </motion.button>
  );
}

export default function DoorPage() {
  return (
    <StaffGuard>
      <Door />
    </StaffGuard>
  );
}

function Door() {
  const hydrated = useHydrated();
  const events = useStore((s) => s.events);
  const spaces = useStore((s) => s.spaces);
  const reservations = useStore((s) => s.reservations);
  const offlineQueue = useStore((s) => s.offlineQueue);
  const { checkIn, checkInManual } = useStore.getState();
  const staff = useStaff();
  const router = useRouter();

  const upcoming = useMemo(() => [...events].filter((e) => e.status === "published").sort((a, b) => a.startsAt.localeCompare(b.startsAt)), [events]);
  const [eventId, setEventId] = useState(upcoming[0]?.id ?? "");
  const [tab, setTab] = useState<"scan" | "busca">("scan");
  const [camera, setCamera] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [q, setQ] = useState("");
  const [online, setOnline] = useState(true);
  const close = useCallback(() => setResult(null), []);

  useEffect(() => {
    const up = () => setOnline(navigator.onLine);
    up();
    window.addEventListener("online", up);
    window.addEventListener("offline", up);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", up);
    };
  }, []);

  const eventRes = reservations.filter((r) => r.eventId === eventId && (isConfirmed(r) || r.status === "aguardando"));
  const entered = eventRes.filter((r) => r.status === "check_in");
  const expectedPeople = eventRes.filter(isConfirmed).reduce((a, r) => a + r.partySize, 0);
  const enteredPeople = entered.reduce((a, r) => a + r.partySize, 0);

  const term = q.trim().toLowerCase();
  const found = term.length >= 2 ? eventRes.filter((r) => r.holderName.toLowerCase().includes(term) || r.code.toLowerCase().includes(term) || r.guests.some((g) => g.name.toLowerCase().includes(term) || g.cpfMasked?.endsWith(term))) : [];

  // ingressos de exemplo para testar sem câmera
  const samples = eventRes.filter((r) => isConfirmed(r) && r.status !== "check_in").slice(0, 3);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pt-3 pb-6">
      <header className="flex items-center gap-2">
        {staff?.role === "portaria" ? (
          <button
            onClick={() => {
              useStore.getState().signOutStaff();
              router.replace("/equipe/entrar");
            }}
            aria-label="Sair"
            className="grid size-10 place-items-center rounded-xl bg-white/5"
          >
            <LogOut className="size-4" />
          </button>
        ) : (
          <Link href="/painel" aria-label="Voltar ao painel" className="grid size-10 place-items-center rounded-xl bg-white/5">
            <ArrowLeft className="size-4" />
          </Link>
        )}
        <div className="flex-1">
          <p className="font-display text-xl leading-tight">Portaria {BRAND.short}</p>
          <select
            aria-label="Evento"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="-ml-1 max-w-full bg-transparent text-sm text-muted-foreground [&>option]:bg-popover"
          >
            {upcoming.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", online ? "bg-[var(--st-free)]/15 text-[var(--st-free)]" : "bg-[var(--st-hold)]/15 text-[var(--st-hold)]")}>
          {online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
          {online ? "Online" : `Offline · ${offlineQueue} na fila`}
        </span>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <p className="text-xs text-muted-foreground">Pessoas na casa</p>
          <p className="font-display text-2xl font-bold tabular-nums">
            {hydrated ? enteredPeople : "—"}
            <span className="text-base font-medium text-muted-foreground">/{hydrated ? expectedPeople : "—"}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <p className="text-xs text-muted-foreground">Camarotes com check-in</p>
          <p className="font-display text-2xl font-bold tabular-nums">
            {hydrated ? entered.length : "—"}
            <span className="text-base font-medium text-muted-foreground">/{hydrated ? eventRes.filter(isConfirmed).length : "—"}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 rounded-xl bg-white/[0.04] p-1" role="tablist">
        {(
          [
            { k: "scan", label: "Ler QR Code", icon: QrCode },
            { k: "busca", label: "Buscar nome/CPF", icon: Search },
          ] as const
        ).map((t) => (
          <button
            key={t.k}
            role="tab"
            aria-selected={tab === t.k}
            onClick={() => setTab(t.k)}
            className={cn("flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium", tab === t.k ? "bg-background shadow" : "text-muted-foreground")}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "scan" ? (
        <div className="mt-4 space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-black">
            {camera ? (
              <Scanner
                onScan={(codes) => {
                  if (codes[0]?.rawValue && !result) setResult(checkIn(codes[0].rawValue, eventId));
                }}
                onError={() => setCamera(false)}
                paused={!!result}
                constraints={{ facingMode: "environment" }}
                sound={false}
                styles={{ container: { width: "100%", height: "100%" }, video: { objectFit: "cover" } }}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                <CameraOff className="size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Aponte a câmera para o QR Code da reserva.</p>
                <Button className="h-12 gap-2 px-6 text-base" onClick={() => setCamera(true)}>
                  <Camera className="size-5" /> Abrir câmera
                </Button>
              </div>
            )}
            {camera && (
              <div aria-hidden className="pointer-events-none absolute inset-10 rounded-3xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                <motion.div className="absolute inset-x-4 h-0.5 bg-primary shadow-[0_0_12px_var(--primary)]" animate={{ top: ["8%", "92%", "8%"] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
              </div>
            )}
          </div>

          {hydrated && samples.length > 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 p-3">
              <p className="mb-2 text-xs text-muted-foreground">Demonstração: simular a leitura de um QR</p>
              <div className="flex flex-wrap gap-2">
                {samples.map((r) => (
                  <Button key={r.id} variant="outline" size="sm" onClick={() => setResult(checkIn(ticketToken(r), eventId))}>
                    {r.holderName.split(" ")[0]} · {spaces.find((s) => s.id === r.spaceId)?.label}
                  </Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setResult(checkIn("r_fake.123.abc", eventId))}>
                  QR falso
                </Button>
                {entered[0] && (
                  <Button variant="outline" size="sm" onClick={() => setResult(checkIn(ticketToken(entered[0]), eventId))}>
                    QR repetido
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome do titular ou convidado, código" className="h-12 pl-10 text-base" aria-label="Buscar reserva" />
          </div>
          <ul className="space-y-2">
            {found.map((r) => {
              const sp = spaces.find((s) => s.id === r.spaceId);
              const done = r.status === "check_in";
              return (
                <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.holderName}</p>
                    <p className="text-sm text-muted-foreground">
                      {sp?.label} · {r.partySize} pessoas · #{r.code}
                    </p>
                  </div>
                  <Button className="h-11 px-4" variant={done ? "outline" : "default"} disabled={done} onClick={() => setResult(checkInManual(r.id))}>
                    {done ? "Já entrou" : "Check-in"}
                  </Button>
                </li>
              );
            })}
            {term.length >= 2 && found.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Ninguém encontrado nesta lista.</p>}
          </ul>
        </div>
      )}

      <p className="mt-auto pt-6 text-center text-xs text-muted-foreground">
        A lista do evento fica salva no aparelho. Sem internet, os check-ins entram numa fila e sincronizam quando a conexão voltar.
      </p>

      <AnimatePresence>{result && <ResultOverlay result={result} onClose={close} />}</AnimatePresence>
    </div>
  );
}
