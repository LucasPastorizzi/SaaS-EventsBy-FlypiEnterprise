"use client";

import { useMemo, useState } from "react";
import { Download, MoreHorizontal, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dayMonth, maskPhone } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/labels";
import { isActive, useStore } from "@/lib/store";
import type { Reservation } from "@/lib/types";
import { cn } from "@/lib/utils";

const selectCls =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&>option]:bg-popover";

export default function ReservationsPage() {
  const events = useStore((s) => s.events);
  const spaces = useStore((s) => s.spaces);
  const maps = useStore((s) => s.maps);
  const reservations = useStore((s) => s.reservations);
  const { setReservationStatus, createManualReservation, cancelReservation, decide } = useStore.getState();

  const [q, setQ] = useState("");
  const [eventId, setEventId] = useState("all");
  const [status, setStatus] = useState("all");
  const [mapId, setMapId] = useState("all");
  const [manualOpen, setManualOpen] = useState(false);
  const [listOf, setListOf] = useState<Reservation | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return reservations
      .filter((r) => r.status !== "expirada" && r.status !== "bloqueio")
      .filter((r) => eventId === "all" || r.eventId === eventId)
      .filter((r) => status === "all" || r.status === status)
      .filter((r) => mapId === "all" || spaces.find((s) => s.id === r.spaceId)?.mapId === mapId)
      .filter((r) => !term || r.holderName.toLowerCase().includes(term) || r.code.toLowerCase().includes(term) || r.holderPhone.includes(term) || r.guests.some((g) => g.name.toLowerCase().includes(term)))
      .sort((a, b) => (a.status === "aguardando" ? -1 : 0) - (b.status === "aguardando" ? -1 : 0) || b.createdAt.localeCompare(a.createdAt));
  }, [reservations, q, eventId, status, mapId, spaces]);

  const people = rows.filter((r) => r.status === "confirmada" || r.status === "check_in").reduce((a, r) => a + r.partySize, 0);

  const exportCsv = () => {
    const header = ["codigo", "noite", "camarote", "titular", "whatsapp", "pessoas", "status", "ocasiao", "lista"];
    const lines = rows.map((r) =>
      [
        r.code,
        events.find((e) => e.id === r.eventId)?.name,
        spaces.find((s) => s.id === r.spaceId)?.label,
        r.holderName,
        r.holderPhone,
        r.partySize,
        STATUS_LABEL[r.status].label,
        r.occasion ?? "",
        r.guests.map((g) => g.name).join(", "),
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(";"),
    );
    const blob = new Blob(["﻿" + [header.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `reservas-inn-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <PageHeader
        title="Reservas"
        description={`${rows.length} reservas · ${people} pessoas confirmadas`}
        actions={
          <>
            <Button variant="outline" className="h-9 gap-1.5" onClick={exportCsv}>
              <Download className="size-4" /> Exportar lista
            </Button>
            <Button className="h-9 gap-1.5" onClick={() => setManualOpen(true)}>
              <Plus className="size-4" /> Reserva por telefone
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, convidado, código ou telefone" className="h-9 pl-8" aria-label="Buscar reservas" />
        </div>
        <select aria-label="Noite" className={selectCls} value={eventId} onChange={(e) => setEventId(e.target.value)}>
          <option value="all">Todas as noites</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} · {dayMonth(e.startsAt)}
            </option>
          ))}
        </select>
        <select aria-label="Status" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Todos os status</option>
          {Object.entries(STATUS_LABEL)
            .filter(([k]) => k !== "expirada" && k !== "bloqueio")
            .map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
        </select>
        <select aria-label="Ambiente" className={selectCls} value={mapId} onChange={(e) => setMapId(e.target.value)}>
          <option value="all">Salão e cobertura</option>
          {maps.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/8 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Código</TableHead>
              <TableHead>Titular</TableHead>
              <TableHead>Noite</TableHead>
              <TableHead>Camarote</TableHead>
              <TableHead className="text-right">Pessoas</TableHead>
              <TableHead>Lista</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-44" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const ev = events.find((e) => e.id === r.eventId);
              const sp = spaces.find((s) => s.id === r.spaceId);
              return (
                <TableRow key={r.id} className={cn(r.status === "aguardando" && "bg-[var(--st-hold)]/[0.04]")}>
                  <TableCell className="pl-4 font-mono text-xs text-muted-foreground">#{r.code}</TableCell>
                  <TableCell>
                    <p className="font-medium">{r.holderName}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.holderPhone}
                      {r.occasion && ` · ${r.occasion}`}
                      {r.source === "manual" && " · por telefone"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p>{ev?.name}</p>
                    <p className="text-xs text-muted-foreground">{ev && dayMonth(ev.startsAt)}</p>
                  </TableCell>
                  <TableCell>
                    <p>{sp?.label}</p>
                    <p className="text-xs text-muted-foreground">{sp?.sector}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.partySize}</TableCell>
                  <TableCell>
                    <button onClick={() => setListOf(r)} className="text-sm underline-offset-4 hover:underline">
                      {r.guests.length}/{r.partySize} nomes
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", STATUS_LABEL[r.status].tone)}>{STATUS_LABEL[r.status].label}</span>
                  </TableCell>
                  <TableCell className="pr-3">
                    <div className="flex items-center justify-end gap-1">
                      {r.status === "aguardando" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => decide(r.id, false)}>
                            Recusar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              decide(r.id, true);
                              toast.success(`${sp?.label} confirmado. O cliente recebe o QR Code.`);
                            }}
                          >
                            Confirmar
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" aria-label={`Mais ações da reserva ${r.code}`} />}>
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => setListOf(r)}>Ver lista de convidados</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`https://wa.me/55${r.holderPhone.replace(/\D/g, "")}`, "_blank", "noopener")}>Chamar no WhatsApp</DropdownMenuItem>
                          {r.status === "confirmada" && (
                            <>
                              <DropdownMenuItem onClick={() => setReservationStatus(r.id, "check_in")}>Fazer check-in</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setReservationStatus(r.id, "no_show")}>Marcar que não veio</DropdownMenuItem>
                            </>
                          )}
                          {isActive(r) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => {
                                  cancelReservation(r.id);
                                  toast.success(`Reserva #${r.code} cancelada. ${sp?.label} liberado.`);
                                }}
                              >
                                Cancelar reserva
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Nenhuma reserva com esses filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ManualReservationDialog open={manualOpen} onOpenChange={setManualOpen} onCreate={createManualReservation} />

      <Dialog open={!!listOf} onOpenChange={(o) => !o && setListOf(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lista · {spaces.find((s) => s.id === listOf?.spaceId)?.label}</DialogTitle>
            <DialogDescription>
              {listOf?.holderName} · {listOf?.guests.length}/{listOf?.partySize} nomes
            </DialogDescription>
          </DialogHeader>
          <ol className="max-h-80 space-y-1.5 overflow-y-auto text-sm">
            {listOf?.guests.map((g, i) => (
              <li key={g.id} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
                <span>
                  {i + 1}. {g.name}
                </span>
                {g.cpfMasked && <span className="font-mono text-xs text-muted-foreground">{g.cpfMasked}</span>}
              </li>
            ))}
          </ol>
          {listOf?.notes && <p className="rounded-lg bg-[var(--violet)]/10 p-3 text-sm">“{listOf.notes}”</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ManualReservationDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: ReturnType<typeof useStore.getState>["createManualReservation"];
}) {
  const events = useStore((s) => s.events);
  const spaces = useStore((s) => s.spaces);
  const reservations = useStore((s) => s.reservations);
  const blocks = useStore((s) => s.blocks);
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [spaceId, setSpaceId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState(10);

  const free = spaces.filter((s) => s.bookable && !blocks[eventId]?.includes(s.id) && !reservations.some((r) => r.eventId === eventId && r.spaceId === s.id && isActive(r)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reserva por telefone</DialogTitle>
          <DialogDescription>Para quem reservou pelo WhatsApp ou no balcão. Já entra como confirmada.</DialogDescription>
        </DialogHeader>
        <form
          id="manual"
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const r = onCreate({ eventId, spaceId, holderName: name, holderPhone: phone, partySize: party });
            if (r) {
              toast.success(`Reserva #${r.code} criada.`);
              onOpenChange(false);
              setName("");
              setPhone("");
              setSpaceId("");
            } else toast.error("Esse camarote não está mais livre.");
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="m-ev">Noite</Label>
            <select id="m-ev" className={cn(selectCls, "w-full")} value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {dayMonth(e.startsAt)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-sp">Camarote livre</Label>
            <select id="m-sp" required className={cn(selectCls, "w-full")} value={spaceId} onChange={(e) => setSpaceId(e.target.value)}>
              <option value="">Escolha…</option>
              {free.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} · {s.sector} · até {s.capacity}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[1fr_90px] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-name">Nome do titular</Label>
              <Input id="m-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-party">Pessoas</Label>
              <Input id="m-party" type="number" min={1} max={40} value={party} onChange={(e) => setParty(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-phone">WhatsApp</Label>
            <Input id="m-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="manual">
            Criar reserva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
