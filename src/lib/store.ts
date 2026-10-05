"use client";

// Estado do app em memória + localStorage. Faz o papel do backend nesta fase
// só de front-end: bloqueio temporário, solicitação, aprovação, check-in e
// editor de mapa. Cada ação corresponde a uma rota/RPC do backend futuro.
import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { toast } from "sonner";
import { BRAND } from "@/brand";
import { hashPassword, onlyDigits, signOutMarker } from "./auth";
import { EVENTS, MAPS, SPACES, STAFF, VENUE, randomName, seeded } from "./mock-data";
import type { CustomerAccount, EventItem, Guest, Reservation, Space, SpaceStatus, StaffUser, Venue, VenueMap } from "./types";

/** status que ocupam o camarote (mesma regra do índice único que o banco terá) */
const ACTIVE: Reservation["status"][] = ["bloqueio", "aguardando", "confirmada", "check_in"];
const CONFIRMED: Reservation["status"][] = ["confirmada", "check_in"];

export const uid = (p = "") => p + Math.random().toString(36).slice(2, 10);
const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();

/** Assinatura de demonstração. No backend real é HMAC-SHA256 com segredo no servidor. */
export function signTicket(id: string, nonce: string) {
  let h = 0;
  for (const c of `${id}.${nonce}.${BRAND.id}-demo`) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return (h >>> 0).toString(36);
}
export const ticketToken = (r: Reservation) => `${r.id}.${r.ticketNonce}.${signTicket(r.id, r.ticketNonce)}`;

function seedReservations(): Reservation[] {
  const list: Reservation[] = [];
  // ocupação de exemplo por noite, na ordem em que aparecem
  const occupancy = [0.45, 0.65, 0.2];
  for (const [i, ev] of EVENTS.entries()) {
    const rand = seeded(ev.id);
    for (const s of SPACES) {
      if (!s.bookable || s.id === "r5") continue;
      if (rand() > (occupancy[i] ?? 0.3)) continue;
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
  customers: CustomerAccount[];
  staff: StaffUser[];
  /** id da conta do cliente logado neste navegador */
  customerSession: string | null;
  /** id da pessoa da equipe logada neste navegador */
  staffSession: string | null;

  findCustomer: (contact: { phone?: string; email?: string }) => CustomerAccount | undefined;
  signInCustomer: (customerId: string) => void;
  createCustomer: (input: { name: string; phone?: string; email?: string; marketing: boolean }) => CustomerAccount;
  updateCustomer: (id: string, patch: Partial<Omit<CustomerAccount, "id">>) => void;
  signOutCustomer: () => void;
  signInStaff: (email: string, password: string) => Promise<{ ok: true; user: StaffUser } | { ok: false; error: string }>;
  signOutStaff: () => void;
  addStaff: (input: { name: string; email: string; role: StaffUser["role"]; password: string }) => Promise<{ ok: boolean; error?: string }>;
  updateStaff: (id: string, patch: Partial<Pick<StaffUser, "role" | "active" | "name">>) => void;
  removeStaff: (id: string) => void;

  createHold: (eventId: string, spaceId: string, customerId: string) => { ok: true; reservation: Reservation } | { ok: false; error: string };
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
  // na primeira noite, o Rooftop VIP começa bloqueado (uso da casa)
  blocks: (EVENTS[0] ? { [EVENTS[0].id]: ["r5"] } : {}) as Record<string, string[]>,
  offlineQueue: 0,
  customers: [] as CustomerAccount[],
  staff: STAFF,
  customerSession: null as string | null,
  staffSession: null as string | null,
});

const occupied = (list: Reservation[], eventId: string, spaceId: string) => list.some((r) => r.eventId === eventId && r.spaceId === spaceId && ACTIVE.includes(r.status));

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),

      findCustomer: ({ phone, email }) => {
        const p = phone ? onlyDigits(phone) : undefined;
        const e = email?.trim().toLowerCase();
        return get().customers.find((c) => (p && c.phone === p) || (e && c.email === e));
      },

      signInCustomer: (customerId) => set({ customerSession: customerId }),

      createCustomer: ({ name, phone, email, marketing }) => {
        const c: CustomerAccount = {
          id: uid("cl_"),
          name: name.trim(),
          phone: phone ? onlyDigits(phone) : undefined,
          email: email?.trim().toLowerCase() || undefined,
          marketing,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ customers: [...s.customers, c], customerSession: c.id }));
        return c;
      },

      updateCustomer: (id, patch) => set((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      signOutCustomer: () => set({ customerSession: null }),

      signInStaff: async (email, password) => {
        const user = get().staff.find((u) => u.email === email.trim().toLowerCase());
        const hash = await hashPassword(email, password);
        // mesma mensagem para e-mail inexistente e senha errada (não revela quem tem conta)
        if (!user || user.passwordHash !== hash) return { ok: false, error: "E-mail ou senha incorretos." };
        if (!user.active) return { ok: false, error: "Este acesso foi desativado. Fale com o dono da casa." };
        set({ staffSession: user.id });
        return { ok: true, user };
      },

      signOutStaff: () => {
        signOutMarker.at = Date.now();
        set({ staffSession: null });
      },

      addStaff: async ({ name, email, role, password }) => {
        const e = email.trim().toLowerCase();
        if (get().staff.some((u) => u.email === e)) return { ok: false, error: "Já existe alguém com esse e-mail." };
        const user: StaffUser = { id: uid("st_"), name: name.trim(), email: e, role, passwordHash: await hashPassword(e, password), active: true, createdAt: new Date().toISOString() };
        set((s) => ({ staff: [...s.staff, user] }));
        return { ok: true };
      },

      updateStaff: (id, patch) => set((s) => ({ staff: s.staff.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),

      removeStaff: (id) => set((s) => ({ staff: s.staff.filter((u) => u.id !== id) })),

      createHold: (eventId, spaceId, customerId) => {
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
          customerId,
        };
        // um camarote por cliente por noite: trocar de camarote libera o anterior
        set({
          reservations: [
            ...reservations.map((r) => (r.customerId === customerId && r.eventId === eventId && r.status === "bloqueio" ? { ...r, status: "expirada" as const } : r)),
            reservation,
          ],
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
        const pending = reservations.find((r) => r.eventId === eventId && !r.customerId && r.status === "aguardando" && r.spaceId !== avoid);
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
      // mantém quem está logado; volta todo o resto ao estado inicial
      resetDemo: () => set((s) => ({ ...initial(), staffSession: s.staffSession, customers: s.customers, customerSession: s.customerSession })),
    }),
    {
      name: BRAND.storageKey,
      version: 1,
      // no servidor não há storage: o estado salvo só entra no navegador (ver useHydrated)
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") throw new Error("sem localStorage no servidor");
        return {
          getItem: (k) => window.localStorage.getItem(k),
          removeItem: (k) => window.localStorage.removeItem(k),
          setItem: (k, v) => {
            try {
              window.localStorage.setItem(k, v);
            } catch {
              // imagens ocupam espaço; sem backend o limite é o do navegador (~5 MB)
              toast.error("Sem espaço para salvar no navegador. Remova algumas fotos das noites.", { id: "storage-full" });
            }
          },
        };
      }),
      skipHydration: true,
      // dados salvos por versões anteriores ganham campos novos de venue
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return { ...current, ...p, venue: { ...current.venue, ...p.venue } };
      },
      partialize: (s) => ({
        venue: s.venue,
        maps: s.maps,
        spaces: s.spaces,
        events: s.events,
        reservations: s.reservations,
        blocks: s.blocks,
        offlineQueue: s.offlineQueue,
        customers: s.customers,
        staff: s.staff,
        customerSession: s.customerSession,
        staffSession: s.staffSession,
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

/** Conta do cliente logado (ou undefined). */
export function useCustomer() {
  return useStore((s) => s.customers.find((c) => c.id === s.customerSession));
}

/** Pessoa da equipe logada (ou undefined); ignora acessos desativados. */
export function useStaff() {
  return useStore((s) => s.staff.find((u) => u.id === s.staffSession && u.active));
}
