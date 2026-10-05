import type { EventItem, StaffUser, Venue } from "@/lib/types";

export type BrandId = "inn" | "movve";

/**
 * Tudo o que muda de uma marca para outra. O resto do app (mapa,
 * camarotes, reservas, painel, portaria) é o mesmo para todas.
 */
export interface BrandConfig {
  id: BrandId;
  /** nome completo, ex.: "INN Lounge Bar" */
  name: string;
  /** nome curto usado nos textos, ex.: "INN" */
  short: string;
  /** "do INN" / "da MOVVE" */
  de: string;
  /** "no INN" / "na MOVVE" */
  em: string;
  /** "o INN" / "a MOVVE" */
  artigo: string;
  metaTitle: string;
  metaDescription: string;
  /** ícone da aba do navegador (arquivo em public/) */
  icon: string;
  themeColor: string;
  /** cor da série nos gráficos do painel */
  chartColor: string;
  /** chave do localStorage (cada marca guarda os próprios dados) */
  storageKey: string;
  venue: Venue;
  events: () => EventItem[];
  /** sugestão no campo "Nome da noite" do painel */
  eventNamePlaceholder: string;
  staff: StaffUser[];
  /** atalhos "Entrar como" da demonstração; vazio em produção */
  demoLogins: { role: StaffUser["role"]; email: string; password: string }[];
}
