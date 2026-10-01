"use client";

import { useState } from "react";
import { Ban, Copy, Images, Pencil, Plus, Repeat } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { CoverPicker, PhotosPicker } from "@/components/admin/event-images";
import { Flyer } from "@/components/flyer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusLegend, VenueMap } from "@/components/venue/venue-map";
import { fullDate } from "@/lib/format";
import { isActive, isConfirmed, statusOf, uid, useStore } from "@/lib/store";
import type { EventItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const FLYERS: EventItem["flyer"][] = [
  { from: "#22C55E", via: "#0F766E", to: "#04110B", motif: "leaves" },
  { from: "#8B5CF6", via: "#6D28D9", to: "#0A0614", motif: "orbs" },
  { from: "#10B981", via: "#7C3AED", to: "#05070A", motif: "waves" },
  { from: "#C08A4B", via: "#7C2D12", to: "#0C0704", motif: "grid" },
  { from: "#EC4899", via: "#7C3AED", to: "#0A0510", motif: "waves" },
];
const STATUS: Record<EventItem["status"], { label: string; tone: string }> = {
  published: { label: "Publicada", tone: "bg-primary/15 text-primary" },
  draft: { label: "Rascunho", tone: "bg-white/10 text-muted-foreground" },
  cancelled: { label: "Cancelada", tone: "bg-[var(--st-sold)]/15 text-[var(--st-sold)]" },
  finished: { label: "Encerrada", tone: "bg-white/10 text-muted-foreground" },
};

/** "2026-10-03T22:00" no horário de Brasília <-> ISO */
const toLocalInput = (iso: string) => new Date(new Date(iso).getTime() - 3 * 3600_000).toISOString().slice(0, 16);
const fromLocalInput = (v: string) => new Date(`${v}:00-03:00`).toISOString();

function blankEvent(): EventItem {
  const start = new Date(Date.now() + 10 * 86400_000);
  start.setUTCHours(1, 0, 0, 0); // 22h em Brasília
  return {
    id: uid("e_"),
    slug: "",
    name: "",
    subtitle: "",
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 6 * 3600_000).toISOString(),
    lineup: [],
    description: "",
    minAge: 18,
    status: "draft",
    flyer: FLYERS[0],
  };
}

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function EventsPage() {
  const events = useStore((s) => s.events);
  const reservations = useStore((s) => s.reservations);
  const spaces = useStore((s) => s.spaces);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [blocking, setBlocking] = useState<EventItem | null>(null);
  const camarotes = spaces.filter((s) => s.bookable).length;

  return (
    <>
      <PageHeader
        title="Noites"
        description="Crie as noites que aparecem no site e controle quais camarotes ficam disponíveis."
        actions={
          <Button className="h-9 gap-1.5" onClick={() => setEditing(blankEvent())}>
            <Plus className="size-4" /> Nova noite
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...events]
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
          .map((e) => {
            const taken = reservations.filter((r) => r.eventId === e.id && isActive(r)).length;
            const pending = reservations.filter((r) => r.eventId === e.id && r.status === "aguardando").length;
            const people = reservations.filter((r) => r.eventId === e.id && isConfirmed(r)).reduce((a, r) => a + r.partySize, 0);
            return (
              <article key={e.id} className="overflow-hidden rounded-2xl border border-white/8 bg-card">
                <Flyer event={e} className="h-36" />
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">{fullDate(e.startsAt)}</p>
                      <p className="text-sm">{e.subtitle}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS[e.status].tone)}>{STATUS[e.status].label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {[
                      ["Camarotes", `${taken}/${camarotes}`],
                      ["Aguardando", String(pending)],
                      ["Pessoas", String(people)],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-white/[0.04] p-2">
                        <p className="text-muted-foreground">{k}</p>
                        <p className="mt-0.5 text-sm font-semibold">{v}</p>
                      </div>
                    ))}
                  </div>
                  {(e.recurring || !!e.photos?.length) && (
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {e.recurring && (
                        <span className="inline-flex items-center gap-1.5">
                          <Repeat className="size-3.5" /> {e.recurring}
                        </span>
                      )}
                      {!!e.photos?.length && (
                        <span className="inline-flex items-center gap-1.5">
                          <Images className="size-3.5" /> {e.photos.length} {e.photos.length === 1 ? "foto" : "fotos"}
                        </span>
                      )}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setEditing(e)}>
                      <Pencil className="size-3.5" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setBlocking(e)}>
                      <Ban className="size-3.5" /> Bloquear camarotes
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Duplicar para a semana seguinte"
                      onClick={() => {
                        const shift = (iso: string) => new Date(new Date(iso).getTime() + 7 * 86400_000).toISOString();
                        useStore.getState().upsertEvent({ ...e, id: uid("e_"), slug: `${e.slug}-${shift(e.startsAt).slice(5, 10)}`, startsAt: shift(e.startsAt), endsAt: shift(e.endsAt), status: "draft" });
                        toast.success("Noite duplicada para a semana seguinte (rascunho).");
                      }}
                    >
                      <Copy />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
      </div>

      {editing && <EventDialog key={editing.id} event={editing} onClose={() => setEditing(null)} />}
      {blocking && <BlockDialog event={blocking} onClose={() => setBlocking(null)} />}
    </>
  );
}

function EventDialog({ event, onClose }: { event: EventItem; onClose: () => void }) {
  const [e, setE] = useState(event);
  const [lineup, setLineup] = useState(event.lineup.map((l) => `${l.time} · ${l.name} · ${l.role}`).join("\n"));
  const isNew = !useStore.getState().events.some((x) => x.id === event.id);

  const save = (status: EventItem["status"]) => {
    if (!e.name.trim()) {
      toast.error("Dê um nome para a noite.");
      return;
    }
    useStore.getState().upsertEvent({
      ...e,
      status,
      slug: e.slug || slugify(e.name),
      lineup: lineup
        .split("\n")
        .map((l) => l.split("·").map((p) => p.trim()))
        .filter((p) => p[1])
        .map(([time, name, role]) => ({ time, name, role: role ?? "" })),
    });
    toast.success(status === "published" ? "Noite publicada no site." : "Rascunho salvo.");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNew ? "Nova noite" : `Editar ${event.name}`}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div className="space-y-3">
            <CoverPicker event={e} onChange={(patch) => setE({ ...e, ...patch })} />
            {!e.cover && (
              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">Ou um estilo de flyer desenhado:</p>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Estilo do flyer">
                  {FLYERS.map((f, i) => (
                    <button
                      key={i}
                      role="radio"
                      aria-checked={e.flyer.from === f.from && e.flyer.motif === f.motif}
                      aria-label={`Estilo ${i + 1}`}
                      onClick={() => setE({ ...e, flyer: f })}
                      className={cn("size-6 rounded-full ring-offset-2 ring-offset-background", e.flyer.from === f.from && e.flyer.motif === f.motif && "ring-2 ring-primary")}
                      style={{ background: `linear-gradient(135deg, ${f.from}, ${f.via})` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ev-name">Nome da noite</Label>
              <Input id="ev-name" value={e.name} onChange={(x) => setE({ ...e, name: x.target.value })} placeholder="Sexta no INN" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-sub">Chamada</Label>
              <Input id="ev-sub" value={e.subtitle} onChange={(x) => setE({ ...e, subtitle: x.target.value })} placeholder="Show ao vivo + DJ" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ev-start">Início</Label>
                <Input id="ev-start" type="datetime-local" value={toLocalInput(e.startsAt)} onChange={(x) => x.target.value && setE({ ...e, startsAt: fromLocalInput(x.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-end">Fim</Label>
                <Input id="ev-end" type="datetime-local" value={toLocalInput(e.endsAt)} onChange={(x) => x.target.value && setE({ ...e, endsAt: fromLocalInput(x.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ev-age">Idade mínima</Label>
                <Input id="ev-age" type="number" min={0} value={e.minAge} onChange={(x) => setE({ ...e, minAge: Number(x.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-rec">Repete</Label>
                <select
                  id="ev-rec"
                  value={e.recurring ?? ""}
                  onChange={(x) => setE({ ...e, recurring: x.target.value || undefined })}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm [&>option]:bg-popover"
                >
                  <option value="">Não repete</option>
                  {["Toda sexta", "Todo sábado"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-desc">Descrição</Label>
              <Textarea id="ev-desc" rows={2} value={e.description} onChange={(x) => setE({ ...e, description: x.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-lineup">Programação (uma por linha: hora · atração · estilo)</Label>
              <Textarea id="ev-lineup" rows={3} value={lineup} onChange={(x) => setLineup(x.target.value)} placeholder="23:00 · Show ao vivo · Banda convidada" />
            </div>
          </div>
        </div>
        <PhotosPicker photos={e.photos ?? []} onChange={(photos) => setE({ ...e, photos })} />
        <DialogFooter className="gap-2">
          {e.status !== "published" && (
            <Button variant="outline" onClick={() => save("draft")}>
              Salvar rascunho
            </Button>
          )}
          <Button onClick={() => save("published")}>{e.status === "published" ? "Salvar" : "Publicar no site"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BlockDialog({ event, onClose }: { event: EventItem; onClose: () => void }) {
  const maps = useStore((s) => s.maps);
  const spaces = useStore((s) => s.spaces);
  const reservations = useStore((s) => s.reservations);
  const blocks = useStore((s) => s.blocks);
  const [mapId, setMapId] = useState(maps[0].id);
  const map = maps.find((m) => m.id === mapId) ?? maps[0];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bloquear camarotes · {event.name}</DialogTitle>
          <DialogDescription>Toque em um camarote livre para tirar da reserva online (uso da casa, convidados). Toque de novo para liberar.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          {maps.map((m) => (
            <Button key={m.id} size="sm" variant={m.id === map.id ? "default" : "outline"} onClick={() => setMapId(m.id)}>
              {m.name}
            </Button>
          ))}
        </div>
        <VenueMap
          map={map}
          spaces={spaces.filter((s) => s.mapId === map.id)}
          statusFor={(s) => statusOf(event.id, s.id, reservations, blocks)}
          onSelect={(s) => {
            const st = statusOf(event.id, s.id, reservations, blocks);
            if (st === "reservado" || st === "em_reserva") {
              toast.error(`${s.label} já tem reserva e não pode ser bloqueado.`);
              return;
            }
            useStore.getState().toggleBlock(event.id, s.id);
          }}
        />
        <StatusLegend />
      </DialogContent>
    </Dialog>
  );
}
