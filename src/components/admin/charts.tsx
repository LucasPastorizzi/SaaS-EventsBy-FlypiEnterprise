"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BRAND } from "@/brand";

/** Série única na cor da marca (contraste ≥ 3:1 sobre o card escuro). */
const SERIES = BRAND.chartColor;

const axis = { stroke: "oklch(1 0 0 / 0%)", tick: { fill: "var(--muted-foreground)", fontSize: 11 }, tickLine: false };

export function ReservationsChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="res" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES} stopOpacity={0.3} />
            <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="oklch(1 0 0 / 6%)" />
        <XAxis dataKey="label" {...axis} interval={4} />
        <YAxis {...axis} width={32} allowDecimals={false} />
        <Tooltip
          cursor={{ stroke: "oklch(1 0 0 / 25%)", strokeWidth: 1 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="rounded-lg border border-white/10 bg-popover px-3 py-2 text-xs shadow-xl">
                <p className="text-muted-foreground">{String(label)}</p>
                <p className="mt-0.5 font-semibold text-foreground tabular-nums">{Number(payload[0].value)} camarotes</p>
              </div>
            ) : null
          }
        />
        <Area type="monotone" dataKey="value" stroke={SERIES} strokeWidth={2} fill="url(#res)" activeDot={{ r: 5, stroke: "var(--background)", strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
