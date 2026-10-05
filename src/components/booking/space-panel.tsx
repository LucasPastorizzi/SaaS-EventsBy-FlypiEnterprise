"use client";

import { Check, Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATUS_META } from "@/components/venue/venue-map";
import type { Space, SpaceStatus } from "@/lib/types";

export function SpacePanel({
  space,
  status,
  party,
  setParty,
  onReserve,
  isMine,
}: {
  space: Space;
  status: SpaceStatus;
  party: number;
  setParty: (n: number) => void;
  onReserve: () => void;
  isMine: boolean;
}) {
  const available = status === "disponivel" || isMine;
  const rooftop = space.sector.toLowerCase().includes("cobertura");

  return (
    <div className="space-y-4">
      <div
        className="relative h-32 overflow-hidden rounded-xl"
        style={{
          background: rooftop
            ? "radial-gradient(circle at 70% 20%, color-mix(in oklch, var(--primary) 75%, black), var(--card) 75%)"
            : "radial-gradient(circle at 30% 20%, color-mix(in oklch, var(--violet) 65%, black), var(--card) 75%)",
        }}
      >
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--wood) 0 2px, transparent 2px 22px)" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <p className="text-xs tracking-widest text-white/70 uppercase">{space.sector}</p>
          <p className="font-display text-3xl text-white">{space.label}</p>
        </div>
        <span className="absolute top-3 right-3 rounded-full px-2 py-0.5 text-xs font-semibold text-black" style={{ background: isMine ? "var(--violet)" : STATUS_META[status].color }}>
          {isMine ? "Separado para você" : STATUS_META[status].label}
        </span>
      </div>

      {space.description && <p className="text-sm text-muted-foreground">{space.description}</p>}

      <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-3 text-sm">
        <Users className="size-4 text-primary" /> Até <strong className="font-semibold">{space.capacity} pessoas</strong>
      </div>
      {space.perks && (
        <ul className="space-y-1.5 text-sm">
          {space.perks.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <Check className="size-4 text-primary" /> {p}
            </li>
          ))}
        </ul>
      )}

      {available ? (
        <>
          <div className="flex items-center justify-between rounded-xl border border-white/8 p-3">
            <span className="text-sm">Quantas pessoas vão?</span>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" aria-label="Menos pessoas" disabled={party <= 1} onClick={() => setParty(party - 1)}>
                <Minus />
              </Button>
              <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
                {party}
              </span>
              <Button size="icon" variant="outline" aria-label="Mais pessoas" disabled={party >= space.capacity} onClick={() => setParty(party + 1)}>
                <Plus />
              </Button>
            </div>
          </div>
          <Button className="h-12 w-full text-base font-semibold shadow-[0_0_30px_-8px_var(--primary)]" onClick={onReserve}>
            {isMine ? "Continuar" : `Quero o ${space.label}`}
          </Button>
          {!isMine && <p className="text-center text-xs text-muted-foreground">O camarote fica separado para você por 10 minutos enquanto preenche os dados.</p>}
        </>
      ) : (
        <p className="rounded-xl border border-white/8 p-3 text-center text-sm text-muted-foreground">
          {status === "em_reserva" ? "Outra pessoa está reservando este camarote agora. Se não for confirmado, ele volta a ficar livre." : "Este camarote não está disponível nesta noite. Escolha outro no mapa."}
        </p>
      )}
    </div>
  );
}
