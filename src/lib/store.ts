"use client";

// Estado do app em memória + localStorage. Faz o papel do backend nesta fase
// só de front-end: bloqueio temporário, solicitação, aprovação, check-in e
// editor de mapa. Cada ação corresponde a uma rota/RPC do backend futuro.
import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { EVENTS, MAPS, SPACES, VENUE, randomName, seeded } from "./mock-data";
import type { EventItem, Guest, Reservation, Space, SpaceStatus, Venue, VenueMap } from "./types";

/** status que ocupam o camarote (mesma regra do índice único que o banco terá) */
const ACTIVE: Reservation["status"][] = ["bloqueio", "aguardando", "confirmada", "check_in"];
const CONFIRMED: Reservation["status"][] = ["confirmada", "check_in"];

export const uid = (p = "") => p + Math.random().toString(36).slice(2, 10);
const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();

/** Assinatura de demonstração. No backend real é HMAC-SHA256 com segredo no servidor. */
export function signTicket(id: string, nonce: string) {
  let h = 0;
  for (const c of `${id}.${nonce}.inn-demo`) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return (h >>> 0).toString(36);
}
export const ticketToken = (r: Reservation) => `${r.id}.${r.ticketNonce}.${signTicket(r.id, r.ticketNonce)}`;

function seedReservations(): Reservation[] {
  const list: Reservation[] = [];
  const occupancy: Record<string, number> = { e_sexta: 0.45, e_sabado: 0.65, e_rooftop: 0.2 };
  for (const ev of EVENTS) {
    const rand = seeded(ev.id);
    for (const s of SPACES) {
      if (!s.bookable || s.id === "r5") continue;
      if (rand() > occupancy[ev.id]) continue;
      const name = randomName(rand);
      const party = Math.max(4, Math.round(s.capacity * (0.5 + rand() * 0.5)));
      const pending = rand() < 0.25;
      list.push({
        id: `r_${ev.id}_${s.id}`,
        code: Math.floor(rand() * 36 ** 6).toString(36).toUpperCase().padStart(6, "X"),
        eventId: ev.id,
        spaceId: s.id,
        status: pending ? "aguardando" : "confirmada",
        partySize: party,
        holderName: name,
        holderPhone: `(51) 9${String(Math.floor(rand() * 1e8)).padStart(8, "0").replace(/(\d{4})(\d{4})/, "$1-$2")}`,
        holderEmail: `${name.split(" ")[0].toLowerCase()}@email.com`,
        occasion: rand() < 0.3 ? "Aniversário" : undefined,
        source: rand() < 0.2 ? "manual" : "online",
        guests: Array.from({ length: Math.min(party, 2 + Math.floor(rand() * 4)) }, (_, i) => ({
          id: `g_${ev.id}_${s.id}_${i}`,
          name: i === 0 ? name : randomName(rand),
          cpfMasked: `***.***.***-${String(Math.floor(rand() * 100)).padStart(2, "0")}`,
        })),
        createdAt: new Date(new Date(ev.startsAt).getTime() - (1 + rand() * 9) * 86400_000).toISOString(),
        ticketNonce: Math.floor(rand() * 1e12).toString(36),
      });
    }
  }
  return list;
}

export interface RequestInput {
  holderName: string;
  holderPhone: string;
  holderEmail: string;
  partySize: number;
  occasion?: string;
  notes?: string;
  guests: Guest[];
}

export type CheckinResult =
  | { kind: "valid"; reservation: Reservation; space?: Space }
  | { kind: "already_used"; reservation: Reservation; space?: Space }
  | { kind: "not_confirmed"; reservation: Reservation; space?: Space }
  | { kind: "invalid"; reason: string };

interface State {
  venue: Venue;
  maps: VenueMap[];
  spaces: Space[];
  events: EventItem[];
  reservations: Reservation[];
  blocks: Record<string, string[]>;
  offlineQueue: number;

  createHold: (eventId: string, spaceId: string) => { ok: true; reservation: Reservation } | { ok: false; error: string };
  releaseHold: (reservationId: string) => void;
  submitRequest: (reservationId: string, input: RequestInput) => Reservation | undefined;
  expireHolds: () => string[];
  decide: (reservationId: string, approve: boolean) => void;
  cancelReservation: (reservationId: string) => void;
  setGuests: (reservationId: string, guests: Guest[]) => void;
  createManualReservation: (input: { eventId: string; spaceId: string; holderName: string; holderPhone: string; partySize: number }) => Reservation | undefined;
  setReservationStatus: (reservationId: string, status: Reservation["status"]) => void;

  checkIn: (token: string, eventId: string) => CheckinResult;
  checkInManual: (reservationId: string) => CheckinResult;

  toggleBlock: (eventId: string, spaceId: string) => void;
  simulateActivity: (eventId: string, avoid?: string) => { label: string; status: SpaceStatus } | null;

  upsertSpace: (space: Space) => void;
  removeSpace: (id: string) => void;
  addMap: (name: string) => string;
  updateMap: (map: VenueMap) => void;
  upsertEvent: (event: EventItem) => void;
  updateVenue: (patch: Partial<Venue>) => void;
  resetDemo: () => void;
}

const initial = () => ({
  venue: VENUE,
  maps: MAPS,
  spaces: SPACES,
  events: EVENTS,
  reservations: seedReservations(),
  blocks: { e_sexta: ["r5"], e_sabado: [], e_rooftop: [] } as Record<string, string[]>,
  offlineQueue: 0,
});

const occupied = (list: Reservation[], eventId: string, spaceId: string) => list.some((r) => r.eventId === eventId && r.spaceId === spaceId && ACTIVE.includes(r.status));

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),

      createHold: (eventId, spaceId) => {
        get().expireHolds();
        const { reservations, blocks, events, spaces, venue } = get();
        const ev = events.find((e) => e.id === eventId);
        const space = spaces.find((s) => s.id === spaceId);
        if (!ev || !space || !space.bookable) return { ok: false, error: "Camarote não encontrado." };
        if (blocks[eventId]?.includes(spaceId)) return { ok: false, error: "Este camarote não está disponível nesta noite." };
        if (occupied(reservations, eventId, spaceId)) return { ok: false, error: "Alguém acabou de escolher este camarote. Escolha outro." };

        const reservation: Reservation = {
          id: uid("r_"),
          code: code(),
          eventId,
          spaceId,
          status: "bloqueio",
          partySize: Math.min(space.capacity, 8),
          holderName: "",
          holderPhone: "",
          holderEmail: "",
          source: "online",
          guests: [],
          holdExpiresAt: new Date(Date.now() + venue.holdMinutes * 60_000).toISOString(),
          createdAt: new Date().toISOString(),
          ticketNonce: uid(),
          mine: true,
        };
        // um camarote por cliente por noite: trocar de camarote libera o anterior
        set({
          reservations: [...reservations.map((r) => (r.mine && r.eventId === eventId && r.status === "bloqueio" ? { ...r, status: "expirada" as const } : r)), reservation],
        });
        return { ok: true, reservation };
      },

      releaseHold: (id) => set((s) => ({ reservations: s.reservations.map((r) => (r.id === id && r.status === "bloqueio" ? { ...r, status: "expirada" } : r)) })),

      submitRequest: (id, input) => {
        let out: Reservation | undefined;
        set((s) => ({
          reservations: s.reservations.map((r) => {
            if (r.id !== id || r.status !== "bloqueio") return r;
            out = { ...r, ...input, status: "aguardando", holdExpiresAt: undefined, createdAt: new Date().toISOString() };
            return out;
          }),
        }));
        return out;
      },

      expireHolds: () => {
        const now = Date.now();
        const expired: string[] = [];
        const reservations = get().reservations.map((r) => {
          if (r.status === "bloqueio" && r.holdExpiresAt && new Date(r.holdExpiresAt).getTime() <= now) {
            expired.push(r.id);
            return { ...r, status: "expirada" as const };
          }
          return r;
        });
        if (expired.length) set({ reservations });
        return expired;
      },

      decide: (id, approve) =>
        set((s) => ({
          reservations: s.reservations.map((r) => (r.id === id && r.status === "aguardando" ? { ...r, status: approve ? "confirmada" : "recusada", decidedAt: new Date().toISOString() } : r)),
        })),

      // trocar o nonce invalida o QR antigo
      cancelReservation: (id) => set((s) => ({ reservations: s.reservations.map((r) => (r.id === id ? { ...r, status: "cancelada", ticketNonce: uid() } : r)) })),

      setGuests: (id, guests) => set((s) => ({ reservations: s.reservations.map((r) => (r.id === id ? { ...r, guests } : r)) })),

      createManualReservation: ({ eventId, spaceId, holderName, holderPhone, partySize }) => {
        const { reservations } = get();
        if (occupied(reservations, eventId, spaceId)) return;
        const r: Reservation = {
          id: uid("r_"),
          code: code(),
          eventId,
          spaceId,
          status: "confirmada",
          partySize,
          holderName,
          holderPhone,
          holderEmail: "",
          source: "manual",
          guests: [{ id: uid("g_"), name: holderName }],
          createdAt: new Date().toISOString(),
          decidedAt: new Date().toISOString(),
          ticketNonce: uid(),
        };
        set({ reservations: [...reservations, r] });
        return r;
      },

      setReservationStatus: (id, status) => set((s) => ({ reservations: s.reservations.map((r) => (r.id === id ? { ...r, status } : r)) })),

      checkIn: (token, eventId) => {
        const [id, nonce, sig] = token.trim().split(".");
        if (!id || !nonce || !sig || signTicket(id, nonce) !== sig) return { kind: "invalid", reason: "QR Code não reconhecido." };
        const r = get().reservations.find((x) => x.id === id);
        if (!r || r.ticketNonce !== nonce) return { kind: "invalid", reason: "Reserva inexistente ou cancelada." };
        if (r.eventId !== eventId) {
          const ev = get().events.find((e) => e.id === r.eventId);
          return { kind: "invalid", reason: `Reserva de outra noite${ev ? `: ${ev.name}` : ""}.` };
        }
        return get().checkInManual(r.id);
      },

      checkInManual: (id) => {
        const r = get().reservations.find((x) => x.id === id);
        if (!r) return { kind: "invalid", reason: "Reserva não encontrada." };
        const space = get().spaces.find((s) => s.id === r.spaceId);
        if (r.status === "check_in") return { kind: "already_used", reservation: r, space };
        if (r.status !== "confirmada") return { kind: "not_confirmed", reservation: r, space };
        const updated: Reservation = { ...r, status: "check_in", checkedInAt: new Date().toISOString() };
        const offline = typeof navigator !== "undefined" && !navigator.onLine;
        set((s) => ({ reservations: s.reservations.map((x) => (x.id === id ? updated : x)), offlineQueue: s.offlineQueue + (offline ? 1 : 0) }));
        return { kind: "valid", reservation: updated, space };
      },

      toggleBlock: (eventId, spaceId) =>
        set((s) => {
          const cur = s.blocks[eventId] ?? [];
          return { blocks: { ...s.blocks, [eventId]: cur.includes(spaceId) ? cur.filter((x) => x !== spaceId) : [...cur, spaceId] } };
        }),

      // Simula outras pessoas escolhendo camarotes ao mesmo tempo (o que o Realtime entregaria).
      simulateActivity: (eventId, avoid) => {
        const { spaces, reservations, blocks } = get();
        const free = spaces.filter((s) => s.bookable && s.id !== avoid && !blocks[eventId]?.includes(s.id) && !occupied(reservations, eventId, s.id));
        const pending = reservations.find((r) => r.eventId === eventId && !r.mine && r.status === "aguardando" && r.spaceId !== avoid);
        if (pending && Math.random() < 0.4) {
          set({ reservations: reservations.map((r) => (r.id === pending.id ? { ...r, status: "confirmada", decidedAt: new Date().toISOString() } : r)) });
          return { label: spaces.find((s) => s.id === pending.spaceId)?.label ?? "", status: "reservado" };
        }
        if (!free.length) return null;
        const s = free[Math.floor(Math.random() * free.length)];
        const r: Reservation = {
          id: uid("r_"),
          code: code(),
          eventId,
          spaceId: s.id,
          status: "aguardando",
          partySize: Math.max(4, Math.floor(s.capacity * 0.7)),
          holderName: randomName(Math.random),
          holderPhone: "",
          holderEmail: "",
          source: "online",
          guests: [],
          createdAt: new Date().toISOString(),
          ticketNonce: uid(),
        };
        set({ reservations: [...reservations, r] });
        return { label: s.label, status: "em_reserva" };
      },

      upsertSpace: (space) => set((s) => ({ spaces: s.spaces.some((x) => x.id === space.id) ? s.spaces.map((x) => (x.id === space.id ? space : x)) : [...s.spaces, space] })),
      removeSpace: (id) => set((s) => ({ spaces: s.spaces.filter((x) => x.id !== id) })),
      addMap: (name) => {
        const id = uid("m_");
        set((s) => ({ maps: [...s.maps, { id, name, width: 1000, height: 700 }] }));
        return id;
      },
      updateMap: (map) => set((s) => ({ maps: s.maps.map((m) => (m.id === map.id ? map : m)) })),
      upsertEvent: (event) => set((s) => ({ events: s.events.some((e) => e.id === event.id) ? s.events.map((e) => (e.id === event.id ? event : e)) : [...s.events, event] })),
      updateVenue: (patch) => set((s) => ({ venue: { ...s.venue, ...patch } })),
      resetDemo: () => set(initial()),
    }),
    {
      name: "inn-reservas-demo",
      version: 1,
      // no servidor não há storage: o estado salvo só entra no navegador (ver useHydrated)
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") throw new Error("sem localStorage no servidor");
        return window.localStorage;
      }),
      skipHydration: true,
      partialize: (s) => ({
        venue: s.venue,
        maps: s.maps,
        spaces: s.spaces,
        events: s.events,
        reservations: s.reservations,
        blocks: s.blocks,
        offlineQueue: s.offlineQueue,
      }),
    },
  ),
);

/**
 * Carrega o localStorage depois da primeira renderização, para o HTML do
 * servidor e do cliente baterem. Retorna true quando o estado salvo já entrou.
 */
export function useHydrated() {
  const ok = useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
  useEffect(() => {
    if (!useStore.persist.hasHydrated()) void useStore.persist.rehydrate();
  }, []);
  return ok;
}

export function statusOf(eventId: string, spaceId: string, reservations: Reservation[], blocks: Record<string, string[]>, now = Date.now()): SpaceStatus {
  if (blocks[eventId]?.includes(spaceId)) return "bloqueado";
  const r = reservations.find((x) => x.eventId === eventId && x.spaceId === spaceId && ACTIVE.includes(x.status));
  if (!r) return "disponivel";
  if (CONFIRMED.includes(r.status)) return "reservado";
  if (r.status === "bloqueio" && r.holdExpiresAt && new Date(r.holdExpiresAt).getTime() <= now) return "disponivel";
  return "em_reserva";
}

export const isActive = (r: Reservation) => ACTIVE.includes(r.status);
export const isConfirmed = (r: Reservation) => CONFIRMED.includes(r.status);
