// Tipos do domínio. Pensados para o INN Lounge Bar: reserva de camarotes,
// sem valores — a casa recebe a solicitação, confirma e o cliente entra com QR Code.

/** "camarote" é reservável; "area" é só referência visual no mapa (palco, pista, bar...). */
export type SpaceType = "camarote" | "area";
export type SpaceShape = "circle" | "rect";
export type SpaceStatus = "disponivel" | "em_reserva" | "reservado" | "bloqueado";

export type ReservationStatus =
  | "bloqueio" // cliente escolheu o camarote e está preenchendo os dados (expira)
  | "aguardando" // solicitação enviada, esperando a casa confirmar
  | "confirmada"
  | "check_in"
  | "no_show"
  | "recusada"
  | "cancelada"
  | "expirada";

export interface Venue {
  name: string;
  tagline: string;
  description: string;
  address: string;
  district: string;
  city: string;
  mapsQuery: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  hours: string;
  minAge: number;
  rules: string[];
  faq: { q: string; a: string }[];
  holdMinutes: number;
  /** até quantas horas antes da noite o cliente pode cancelar sozinho */
  cancelHours: number;
  /** horário-limite de chegada do titular */
  arrivalLimit: string;
}

export interface VenueMap {
  id: string;
  name: string;
  width: number;
  height: number;
  background?: string; // data URL da planta enviada pelo admin
}

export interface Space {
  id: string;
  mapId: string;
  label: string;
  type: SpaceType;
  sector: string;
  shape: SpaceShape;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  capacity: number;
  bookable: boolean;
  description?: string;
  perks?: string[];
}

export interface EventItem {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  startsAt: string; // ISO
  endsAt: string;
  lineup: { name: string; role: string; time: string }[];
  description: string;
  minAge: number;
  status: "draft" | "published" | "cancelled" | "finished";
  flyer: { from: string; via: string; to: string; motif: "waves" | "grid" | "orbs" | "leaves" };
  recurring?: string;
  /** imagem real enviada pela casa (data URL comprimida); substitui o flyer desenhado */
  cover?: string;
  /** mostrar nome e data por cima da imagem (desligar quando a arte já tem o texto) */
  coverShowTitle?: boolean;
  /** fotos reais da noite, exibidas na página da noite */
  photos?: string[];
}

export interface Guest {
  id: string;
  name: string;
  cpfMasked?: string;
}

export interface Reservation {
  id: string;
  code: string;
  eventId: string;
  spaceId: string;
  status: ReservationStatus;
  partySize: number;
  holderName: string;
  holderPhone: string;
  holderEmail: string;
  occasion?: string; // aniversário, despedida...
  notes?: string;
  source: "online" | "manual";
  guests: Guest[];
  holdExpiresAt?: string;
  createdAt: string;
  decidedAt?: string;
  checkedInAt?: string;
  ticketNonce: string;
  /** reserva criada neste navegador (área do cliente) */
  mine?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  reservations: number;
  lastVisit: string;
}
