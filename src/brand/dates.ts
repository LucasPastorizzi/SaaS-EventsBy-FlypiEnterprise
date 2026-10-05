/**
 * Próxima ocorrência de um dia da semana (0 = domingo) no horário de Brasília
 * (UTC-3, sem horário de verão). Calculado em UTC para dar o mesmo resultado no
 * servidor e no navegador.
 */
export function nextWeekday(weekday: number, hour: number, extraWeeks = 0): Date {
  const sp = new Date(Date.now() - 3 * 3600_000);
  const diff = (weekday - sp.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(sp.getUTCFullYear(), sp.getUTCMonth(), sp.getUTCDate() + diff + extraWeeks * 7, hour + 3));
}

/** Data fixa no horário de Brasília, ex.: brt(2026, 10, 9, 22). */
export const brt = (y: number, m: number, d: number, hour: number) => new Date(Date.UTC(y, m - 1, d, hour + 3));

export const iso = (d: Date, addHours = 0) => new Date(d.getTime() + addHours * 3600_000).toISOString();
