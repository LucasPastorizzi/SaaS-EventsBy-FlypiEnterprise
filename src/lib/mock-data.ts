// Dados de demonstração do INN Lounge Bar. Nada aqui vem de banco: quando o
// backend entrar, estas constantes viram chamadas de API com os mesmos formatos.
// Line-ups e nomes de clientes são fictícios.
import type { EventItem, Space, Venue, VenueMap } from "./types";

export const VENUE: Venue = {
  name: "INN Lounge Bar",
  tagline: "Boa música, drinks e a melhor noite de Hamburgo Velho.",
  description:
    "Uma casa de madeira cercada de plantas e luzes verdes, com pista, palco para shows e mesas na cobertura. Garanta seu camarote para curtir a noite com a sua turma, sem fila e sem estresse.",
  address: "R. Gen. Osório, 951",
  district: "Hamburgo Velho",
  city: "Novo Hamburgo · RS",
  mapsQuery: "INN Lounge Bar, R. Gen. Osório, 951, Novo Hamburgo - RS",
  phone: "(51) 99924-2719",
  whatsapp: "5551999242719",
  instagram: "innloungebarnh",
  hours: "Sextas e sábados, a partir das 20h",
  minAge: 18,
  rules: [
    "Entrada somente para maiores de 18 anos, com documento original com foto.",
    "O titular do camarote precisa chegar até 0h30. Depois disso, a casa pode liberar o espaço.",
    "Cada pessoa da lista entra com o próprio nome; leve documento.",
    "Não é permitida a entrada com bebidas ou alimentos de fora.",
  ],
  faq: [
    { q: "Como funciona a reserva?", a: "Você escolhe a noite e o camarote no mapa, informa seus dados e a lista de convidados. A equipe do INN confirma pelo WhatsApp e o seu QR Code de entrada é liberado." },
    { q: "Preciso imprimir alguma coisa?", a: "Não. Mostre o QR Code no celular na entrada. Ele fica salvo em Minhas reservas." },
    { q: "Meus convidados precisam chegar juntos?", a: "Não. Cada convidado da lista entra com o nome e documento. Você também pode mandar um link para eles se cadastrarem." },
    { q: "Posso cancelar?", a: "Sim, pelo próprio site até 24h antes da noite. Depois disso, fale com a casa pelo WhatsApp." },
  ],
  holdMinutes: 10,
  cancelHours: 24,
  arrivalLimit: "0h30",
};

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

/**
 * Próxima ocorrência de um dia da semana (0 = domingo) no horário de Brasília
 * (UTC-3, sem horário de verão). Calculado em UTC para dar o mesmo resultado no
 * servidor e no navegador.
 */
function nextWeekday(weekday: number, hour: number, extraWeeks = 0): Date {
  const sp = new Date(Date.now() - 3 * 3600_000);
  const diff = (weekday - sp.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(sp.getUTCFullYear(), sp.getUTCMonth(), sp.getUTCDate() + diff + extraWeeks * 7, hour + 3));
}
const iso = (d: Date, addHours = 0) => new Date(d.getTime() + addHours * 3600_000).toISOString();

const fri = nextWeekday(5, 22);
const sat = nextWeekday(6, 22);
const nextFri = nextWeekday(5, 22, 1);

export const EVENTS: EventItem[] = [
  {
    id: "e_sexta",
    slug: "sexta-no-inn",
    name: "Sexta no INN",
    subtitle: "DJ set até o fim da noite",
    startsAt: iso(fri),
    endsAt: iso(fri, 6),
    lineup: [
      { name: "DJ residente INN", role: "DJ set", time: "23:30" },
      { name: "Abertura", role: "Warm-up", time: "22:00" },
    ],
    description: "A sexta que começa o fim de semana em Hamburgo Velho: pista cheia, drinks e luz baixa.",
    minAge: 18,
    status: "published",
    flyer: { from: "#22C55E", via: "#0F766E", to: "#04110B", motif: "leaves" },
    recurring: "Toda sexta",
  },
  {
    id: "e_sabado",
    slug: "sabado-ao-vivo",
    name: "Sábado ao vivo",
    subtitle: "Show no palco + DJ na sequência",
    startsAt: iso(sat),
    endsAt: iso(sat, 6),
    lineup: [
      { name: "Show ao vivo", role: "Banda convidada", time: "23:00" },
      { name: "DJ residente INN", role: "Pós-show", time: "01:00" },
    ],
    description: "Noite de show no palco do INN. Os camarotes do salão costumam ser os primeiros a fechar.",
    minAge: 18,
    status: "published",
    flyer: { from: "#8B5CF6", via: "#6D28D9", to: "#0A0614", motif: "orbs" },
    recurring: "Todo sábado",
  },
  {
    id: "e_rooftop",
    slug: "rooftop-sessions",
    name: "Rooftop Sessions",
    subtitle: "Noite especial na cobertura",
    startsAt: iso(nextFri),
    endsAt: iso(nextFri, 6),
    lineup: [
      { name: "DJ convidado", role: "House", time: "23:00" },
      { name: "DJ residente INN", role: "Abertura", time: "22:00" },
    ],
    description: "Edição especial com a cobertura aberta, entre as plantas e as luzes verdes.",
    minAge: 18,
    status: "published",
    flyer: { from: "#10B981", via: "#7C3AED", to: "#05070A", motif: "waves" },
  },
];

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
