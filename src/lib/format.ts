const TZ = "America/Sao_Paulo";

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, ...opts });

const weekdayFmt = fmt({ weekday: "long" });
const dayMonthFmt = fmt({ day: "2-digit", month: "short" });
const timeFmt = fmt({ hour: "2-digit", minute: "2-digit" });
const fullFmt = fmt({ weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const dayFmt = fmt({ day: "2-digit" });
const monthFmt = fmt({ month: "short" });

export const weekday = (iso: string) => {
  const s = weekdayFmt.format(new Date(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const dayMonth = (iso: string) => dayMonthFmt.format(new Date(iso)).replace(".", "");
export const time = (iso: string) => timeFmt.format(new Date(iso));
export const fullDate = (iso: string) => {
  const s = fullFmt.format(new Date(iso)).replace(/\./g, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const day = (iso: string) => dayFmt.format(new Date(iso));
export const month = (iso: string) => monthFmt.format(new Date(iso)).replace(".", "").toUpperCase();

export function countdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function maskCpf(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** Exibição segura: só os 2 últimos dígitos ficam visíveis. */
export const hideCpf = (raw: string) => {
  const d = raw.replace(/\D/g, "");
  return d.length === 11 ? `***.***.***-${d.slice(9)}` : "";
};

export function maskPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
