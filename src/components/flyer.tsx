import { cn } from "@/lib/utils";
import type { EventItem } from "@/lib/types";
import { day, month } from "@/lib/format";

/** Flyer gerado (sem imagem): gradiente da noite + padrão + tipografia. */
export function Flyer({ event, className, size = "md" }: { event: EventItem; className?: string; size?: "sm" | "md" | "lg" }) {
  const { from, via, to, motif } = event.flyer;
  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{ background: `radial-gradient(120% 90% at 20% 0%, ${from} 0%, ${via} 45%, ${to} 100%)` }}
      aria-hidden
    >
      <svg className="absolute inset-0 -z-10 size-full opacity-40 mix-blend-overlay" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
        {motif === "waves" &&
          Array.from({ length: 14 }, (_, i) => (
            <path key={i} d={`M-20 ${60 + i * 32} Q 100 ${20 + i * 32} 200 ${60 + i * 32} T 420 ${60 + i * 32}`} fill="none" stroke="white" strokeWidth="1.5" />
          ))}
        {motif === "grid" &&
          Array.from({ length: 12 }, (_, i) => (
            <g key={i}>
              <line x1={i * 36} y1="0" x2={200 + (i * 36 - 200) * 2.4} y2="500" stroke="white" strokeWidth="1" />
              <line x1="0" y1={260 + i * i * 2.2} x2="400" y2={260 + i * i * 2.2} stroke="white" strokeWidth="1" />
            </g>
          ))}
        {motif === "leaves" &&
          Array.from({ length: 9 }, (_, i) => {
            const x = (i % 3) * 150 + 40;
            const y = Math.floor(i / 3) * 170 + 30;
            return (
              <g key={i} transform={`rotate(${(i * 47) % 360} ${x + 40} ${y + 60})`}>
                <path d={`M${x + 40} ${y} C ${x + 100} ${y + 40}, ${x + 90} ${y + 110}, ${x + 40} ${y + 130} C ${x - 10} ${y + 110}, ${x - 20} ${y + 40}, ${x + 40} ${y} Z`} fill="none" stroke="white" strokeWidth="1.6" />
                <path d={`M${x + 40} ${y + 6} L ${x + 40} ${y + 124}`} stroke="white" strokeWidth="1" />
              </g>
            );
          })}
        {motif === "orbs" &&
          [
            [80, 120, 90],
            [300, 80, 60],
            [260, 330, 120],
            [60, 400, 50],
          ].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth="2" />)}
      </svg>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className={cn("flex h-full flex-col justify-between p-4 text-white", size === "lg" && "p-6 md:p-8")}>
        <div className="flex items-start justify-between">
          <div className="rounded-lg bg-black/35 px-2.5 py-1.5 text-center leading-none backdrop-blur">
            <div className={cn("font-display font-bold", size === "sm" ? "text-lg" : "text-2xl")}>{day(event.startsAt)}</div>
            <div className="text-[10px] font-semibold tracking-widest">{month(event.startsAt)}</div>
          </div>
          {event.recurring && <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase backdrop-blur">{event.recurring}</span>}
        </div>
        <div>
          <p
            className={cn(
              "font-display leading-[0.92] uppercase",
              size === "sm" && "text-2xl",
              size === "md" && "text-4xl",
              size === "lg" && "text-5xl md:text-7xl",
            )}
          >
            {event.name}
          </p>
          {size !== "sm" && <p className="mt-2 line-clamp-1 text-xs text-white/75">{event.lineup.map((l) => l.name).join(" · ")}</p>}
        </div>
      </div>
    </div>
  );
}
