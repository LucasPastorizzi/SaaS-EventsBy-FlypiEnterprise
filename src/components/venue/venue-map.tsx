"use client";

import { Maximize2, Minus, Plus } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Space, SpaceStatus, VenueMap as VenueMapT } from "@/lib/types";
import { usePanZoom } from "./use-pan-zoom";

export const STATUS_META: Record<SpaceStatus, { label: string; color: string }> = {
  disponivel: { label: "Disponível", color: "var(--st-free)" },
  em_reserva: { label: "Em reserva", color: "var(--st-hold)" },
  reservado: { label: "Reservado", color: "var(--st-sold)" },
  bloqueado: { label: "Bloqueado", color: "var(--st-blocked)" },
};

export function StatusLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground", className)}>
      {(Object.keys(STATUS_META) as SpaceStatus[]).map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: STATUS_META[s].color }} aria-hidden />
          {STATUS_META[s].label}
        </li>
      ))}
    </ul>
  );
}

interface Props {
  map: VenueMapT;
  spaces: Space[];
  statusFor: (space: Space) => SpaceStatus;
  selectedId?: string | null;
  mineId?: string | null;
  onSelect?: (space: Space) => void;
  className?: string;
}

export function VenueMap({ map, spaces, statusFor, selectedId, mineId, onSelect, className }: Props) {
  const { ref, view, handlers, wasDrag, zoomIn, zoomOut, reset } = usePanZoom(map.width, map.height);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border bg-[oklch(0.1_0.008_165)]", className)}>
      <div
        ref={ref}
        {...handlers}
        className="touch-none select-none"
        style={{ aspectRatio: `${map.width} / ${map.height}` }}
      >
        <svg viewBox={`0 0 ${map.width} ${map.height}`} className="block size-full" role="group" aria-label={`Mapa da casa: ${map.name}`}>
          <defs>
            <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M25 0H0V25" fill="none" stroke="oklch(1 0 0 / 4%)" strokeWidth="1" />
            </pattern>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            <rect width={map.width} height={map.height} fill="url(#grid)" />
            {map.background && (
              <image href={map.background} width={map.width} height={map.height} opacity={0.35} preserveAspectRatio="xMidYMid meet" />
            )}
            {spaces
              .filter((s) => !s.bookable)
              .map((s) => (
                <g key={s.id} transform={`rotate(${s.rotation} ${s.x + s.w / 2} ${s.y + s.h / 2})`}>
                  <rect
                    x={s.x}
                    y={s.y}
                    width={s.w}
                    height={s.h}
                    rx={14}
                    fill={s.label.startsWith("Palco") || s.label.startsWith("Bar") ? "color-mix(in oklch, var(--violet) 18%, transparent)" : s.label === "Jardim" ? "color-mix(in oklch, var(--primary) 10%, transparent)" : "oklch(1 0 0 / 3%)"}
                    stroke="oklch(1 0 0 / 14%)"
                    strokeDasharray="6 6"
                  />
                  <text
                    x={s.x + s.w / 2}
                    y={s.y + s.h / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-muted-foreground font-display"
                    style={{ fontSize: s.h > 120 ? 28 : 16, letterSpacing: "0.2em", textTransform: "uppercase" }}
                  >
                    {s.label}
                  </text>
                </g>
              ))}
            {spaces
              .filter((s) => s.bookable)
              .map((s) => {
                const st = statusFor(s);
                const color = STATUS_META[st].color;
                const selected = s.id === selectedId;
                const mine = s.id === mineId;
                const clickable = !!onSelect;
                const cx = s.x + s.w / 2;
                const cy = s.y + s.h / 2;
                const common = {
                  fill: `color-mix(in oklch, ${color} ${selected || mine ? 55 : 22}%, oklch(0.16 0.015 290))`,
                  stroke: selected || mine ? "var(--violet)" : color,
                  strokeWidth: selected || mine ? 4 : 2,
                };
                return (
                  <motion.g
                    key={s.id}
                    role={clickable ? "button" : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    aria-label={`${s.label}, ${s.capacity} pessoas, ${STATUS_META[st].label}`}
                    aria-pressed={clickable ? selected : undefined}
                    className={cn("outline-none", clickable && "cursor-pointer [&:focus-visible>*:first-child]:stroke-white")}
                    style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box" }}
                    whileHover={clickable ? { scale: 1.06 } : undefined}
                    whileTap={clickable ? { scale: 0.96 } : undefined}
                    animate={selected ? { scale: 1.08 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    filter={selected || mine ? "url(#glow)" : undefined}
                    onClick={() => {
                      if (!wasDrag()) onSelect?.(s);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect?.(s);
                      }
                    }}
                  >
                    <g transform={`rotate(${s.rotation} ${cx} ${cy})`}>
                      {s.shape === "circle" ? (
                        <ellipse cx={cx} cy={cy} rx={s.w / 2} ry={s.h / 2} {...common} />
                      ) : (
                        <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={12} {...common} />
                      )}
                      {st === "em_reserva" && (
                        <rect x={s.x - 6} y={s.y - 6} width={s.w + 12} height={s.h + 12} rx={s.shape === "circle" ? (s.w + 12) / 2 : 16} fill="none" stroke={color} strokeWidth={2} opacity={0.6}>
                          <animate attributeName="opacity" values="0.7;0;0.7" dur="1.6s" repeatCount="indefinite" />
                        </rect>
                      )}
                    </g>
                    <text
                      x={cx}
                      y={cy - (s.h >= 70 ? 10 : 0)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="pointer-events-none fill-foreground font-semibold"
                      style={{ fontSize: s.h >= 70 ? 22 : 16, fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}
                    >
                      {s.label.replace("Camarote ", "CAM ").replace("Rooftop ", "R")}
                    </text>
                    {s.h >= 70 && (
                      <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="central" className="pointer-events-none fill-muted-foreground" style={{ fontSize: 13 }}>
                        até {s.capacity} pessoas
                      </text>
                    )}
                    {mine && (
                      <text x={cx} y={s.y - 12} textAnchor="middle" className="pointer-events-none font-bold" style={{ fontSize: 13, letterSpacing: "0.1em", fill: "var(--violet)" }}>
                        SEU CAMAROTE
                      </text>
                    )}
                  </motion.g>
                );
              })}
          </g>
        </svg>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-white/5 px-2 py-1.5">
        <p className="text-[11px] text-muted-foreground/80">
          <span className="md:hidden">Pinça com dois dedos para dar zoom</span>
          <span className="hidden md:inline">Ctrl + rolagem ou botões para dar zoom</span>
        </p>
        <div className="flex gap-1">
          {[
            { icon: Minus, label: "Afastar", fn: zoomOut },
            { icon: Plus, label: "Aproximar", fn: zoomIn },
            { icon: Maximize2, label: "Ver mapa inteiro", fn: reset },
          ].map(({ icon: Icon, label, fn }) => (
            <button
              key={label}
              type="button"
              onClick={fn}
              aria-label={label}
              className="grid size-8 place-items-center rounded-lg bg-white/5 text-foreground/80 transition hover:bg-white/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
