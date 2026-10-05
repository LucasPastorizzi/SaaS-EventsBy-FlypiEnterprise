import type { ReservationStatus } from "./types";

export const STATUS_LABEL: Record<ReservationStatus, { label: string; tone: string }> = {
  bloqueio: { label: "Em escolha", tone: "bg-[var(--st-hold)]/15 text-[var(--st-hold)]" },
  aguardando: { label: "Aguardando confirmação", tone: "bg-[var(--st-hold)]/15 text-[var(--st-hold)]" },
  confirmada: { label: "Confirmada", tone: "bg-primary/15 text-primary" },
  check_in: { label: "Check-in feito", tone: "bg-[var(--violet)]/20 text-[var(--violet)]" },
  no_show: { label: "Não compareceu", tone: "bg-white/10 text-muted-foreground" },
  recusada: { label: "Não aprovada", tone: "bg-[var(--st-sold)]/15 text-[var(--st-sold)]" },
  cancelada: { label: "Cancelada", tone: "bg-[var(--st-sold)]/15 text-[var(--st-sold)]" },
  expirada: { label: "Expirada", tone: "bg-white/10 text-muted-foreground" },
};
