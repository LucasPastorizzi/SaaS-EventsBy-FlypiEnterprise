// Dados de demonstração (local, mapa e camarotes do INN Lounge Bar; textos e noites vêm da marca ativa em src/brand). Nada aqui vem de banco: quando o
// backend entrar, estas constantes viram chamadas de API com os mesmos formatos.
// Line-ups e nomes de clientes são fictícios.
import { BRAND } from "@/brand";
import type { EventItem, Space, StaffUser, Venue, VenueMap } from "./types";

export const VENUE: Venue = BRAND.venue;

export const MAPS: VenueMap[] = [
  { id: "m_salao", name: "Salão", width: 1000, height: 700 },
  { id: "m_cobertura", name: "Cobertura", width: 1000, height: 700 },
];

const area = (id: string, mapId: string, label: string, x: number, y: number, w: number, h: number, sector = ""): Space => ({
  id,
  mapId,
  label,
  type: "area",
  sector,
  shape: "rect",
  x,
  y,
  w,
  h,
  rotation: 0,
  capacity: 0,
  bookable: false,
});

const camarote = (s: Omit<Space, "type" | "shape" | "rotation" | "bookable">): Space => ({ type: "camarote", shape: "rect", rotation: 0, bookable: true, ...s });

const SALAO_PERKS = ["Sofá e mesa exclusivos", "Atendimento de garçom", "Entrada pela lista do camarote"];
const COBERTURA_PERKS = ["Céu aberto entre as plantas", "Atendimento de garçom", "Entrada pela lista do camarote"];

export const SPACES: Space[] = [
  // Salão
  area("a_palco", "m_salao", "Palco · DJ", 360, 28, 280, 70, "Pista"),
  area("a_pista", "m_salao", "Pista", 280, 125, 440, 320, "Pista"),
  area("a_bar", "m_salao", "Bar", 650, 560, 320, 70, "Salão"),
  area("a_jardim", "m_salao", "Jardim", 36, 500, 260, 150, "Salão"),
  area("a_entrada", "m_salao", "Entrada", 400, 630, 180, 44, "Salão"),
  ...[0, 1, 2].map((i) =>
    camarote({
      id: `c${i + 1}`,
      mapId: "m_salao",
      label: `Camarote ${i + 1}`,
      sector: "Salão · lado do jardim",
      x: 36,
      y: 40 + i * 145,
      w: 200,
      h: 120,
      capacity: i === 0 ? 15 : 12,
      description: i === 0 ? "O maior do salão, de frente para o palco." : "Ao lado da pista, perto do jardim.",
      perks: SALAO_PERKS,
    }),
  ),
  ...[0, 1, 2].map((i) =>
    camarote({
      id: `c${i + 4}`,
      mapId: "m_salao",
      label: `Camarote ${i + 4}`,
      sector: "Salão · lado do bar",
      x: 764,
      y: 40 + i * 145,
      w: 200,
      h: 120,
      capacity: i === 0 ? 15 : 12,
      description: i === 0 ? "Vista direta para o palco e acesso rápido ao bar." : "Ao lado da pista, perto do bar.",
      perks: SALAO_PERKS,
    }),
  ),

  // Cobertura
  area("a_bar_cob", "m_cobertura", "Bar da cobertura", 340, 36, 320, 70, "Cobertura"),
  area("a_lounge", "m_cobertura", "Lounge aberto", 300, 160, 400, 320, "Cobertura"),
  area("a_escada", "m_cobertura", "Escada", 430, 620, 140, 50, "Cobertura"),
  ...[
    [50, 70],
    [50, 330],
    [750, 70],
    [750, 330],
  ].map(([x, y], i) =>
    camarote({
      id: `r${i + 1}`,
      mapId: "m_cobertura",
      label: `Rooftop ${i + 1}`,
      sector: "Cobertura",
      x,
      y,
      w: 200,
      h: 160,
      capacity: 20,
      description: "Camarote ao ar livre na cobertura, cercado de plantas e luzes.",
      perks: COBERTURA_PERKS,
    }),
  ),
  camarote({
    id: "r5",
    mapId: "m_cobertura",
    label: "Rooftop VIP",
    sector: "Cobertura",
    x: 300,
    y: 520,
    w: 400,
    h: 80,
    capacity: 30,
    description: "O maior espaço da casa, ideal para aniversários e grupos grandes.",
    perks: [...COBERTURA_PERKS, "Ideal para aniversários"],
  }),
];

export const EVENTS: EventItem[] = BRAND.events();

/** Gerador determinístico para que o estado inicial seja igual no servidor e no cliente. */
export function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const FIRST = ["Lucas", "Mariana", "Gabriel", "Júlia", "Rafael", "Bruna", "Felipe", "Larissa", "Eduardo", "Camila", "Diego", "Fernanda", "Igor", "Natália", "Vitor", "Paula"];
const LAST = ["Schmidt", "Souza", "Oliveira", "Kunz", "Müller", "Ribeiro", "Carvalho", "Weber", "Martins", "Becker", "Silva", "Pereira"];

export function randomName(rand: () => number) {
  return `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`;
}

/** Equipe de demonstração da marca ativa (senhas no README; aqui só o hash). */
export const STAFF: StaffUser[] = BRAND.staff;

/** Atalhos "Entrar como" da demonstração. Vazio antes de colocar no ar com backend. */
export const DEMO_STAFF_LOGINS = BRAND.demoLogins;
