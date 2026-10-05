// Marca INN Lounge Bar. Line-ups são fictícios.
import { iso, nextWeekday } from "./dates";
import type { BrandConfig } from "./types";

export const inn: BrandConfig = {
  id: "inn",
  name: "INN Lounge Bar",
  short: "INN",
  de: "do INN",
  em: "no INN",
  artigo: "o INN",
  metaTitle: "INN Lounge Bar · Reserva de camarotes",
  metaDescription: "Reserve seu camarote no INN Lounge Bar, em Hamburgo Velho, Novo Hamburgo. Escolha o lugar no mapa e receba o QR Code de entrada.",
  icon: "/brand/inn.svg",
  themeColor: "#000000",
  chartColor: "#3FD483",
  storageKey: "inn-reservas-demo",
  venue: {
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
      {
        q: "Como funciona a reserva?",
        a: "Você escolhe a noite e o camarote no mapa, informa seus dados e a lista de convidados. A equipe do INN confirma pelo WhatsApp e o seu QR Code de entrada é liberado.",
      },
      { q: "Preciso imprimir alguma coisa?", a: "Não. Mostre o QR Code no celular na entrada. Ele fica salvo em Minhas reservas." },
      { q: "Meus convidados precisam chegar juntos?", a: "Não. Cada convidado da lista entra com o nome e documento. Você também pode mandar um link para eles se cadastrarem." },
      { q: "Posso cancelar?", a: "Sim, pelo próprio site até 24h antes da noite. Depois disso, fale com a casa pelo WhatsApp." },
    ],
    holdMinutes: 10,
    cancelHours: 24,
    arrivalLimit: "0h30",
  },
  events: () => {
    const fri = nextWeekday(5, 22);
    const sat = nextWeekday(6, 22);
    const nextFri = nextWeekday(5, 22, 1);

    return [
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
  },
  eventNamePlaceholder: "Sexta no INN",
  staff: [
    {
      id: "st_dono",
      name: "Dono do INN",
      email: "dono@inn.demo",
      role: "dono",
      passwordHash: "94970424af8ddd9dcc63a2304b10c45f5e9d0b39dd85c0a9d460277ba173939b",
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "st_gerente",
      name: "Gerência",
      email: "gerente@inn.demo",
      role: "gerente",
      passwordHash: "45fa3fff4c152a1c89ba6e6aac4df14277a8394b0c137f0f99a9683dbf2136a1",
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "st_portaria",
      name: "Equipe da entrada",
      email: "portaria@inn.demo",
      role: "portaria",
      passwordHash: "f549c89717be60914c69a71547cc0e2b0a27ec1ada2a5a2292b84c0784a66884",
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  demoLogins: [
    { role: "dono", email: "dono@inn.demo", password: "InnDono#2026" },
    { role: "gerente", email: "gerente@inn.demo", password: "InnGerente#2026" },
    { role: "portaria", email: "portaria@inn.demo", password: "InnPortaria#2026" },
  ],
};
