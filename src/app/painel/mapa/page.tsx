"use client";

import { useRef, useState } from "react";
import { Copy, ImageUp, Layers, Plus, RectangleHorizontal, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uid, useStore } from "@/lib/store";
import type { Space, SpaceType } from "@/lib/types";
import { cn } from "@/lib/utils";

const GRID = 5;
const snap = (v: number) => Math.round(v / GRID) * GRID;

const PRESETS: { type: SpaceType; label: string; icon: React.ElementType; make: () => Partial<Space> }[] = [
  { type: "camarote", label: "Camarote", icon: RectangleHorizontal, make: () => ({ shape: "rect", w: 200, h: 120, capacity: 12, sector: "Salão" }) },
  { type: "area", label: "Área (palco, bar, pista...)", icon: Square, make: () => ({ shape: "rect", w: 220, h: 120, capacity: 0, sector: "Salão", bookable: false }) },
];

const TYPE_COLOR: Record<SpaceType, string> = {
  camarote: "var(--st-free)",
  area: "var(--violet)",
};

type Drag = { id: string; mode: "move" | "resize"; startX: number; startY: number; orig: Space };

export default function MapEditor() {
  const maps = useStore((s) => s.maps);
  const allSpaces = useStore((s) => s.spaces);
  const { upsertSpace, removeSpace, addMap, updateMap } = useStore.getState();
  const [mapId, setMapId] = useState(maps[0]?.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const map = maps.find((m) => m.id === mapId) ?? maps[0];
  const spaces = allSpaces.filter((s) => s.mapId === map.id);
  const selected = spaces.find((s) => s.id === selectedId);

  /** posição do ponteiro em unidades do viewBox */
  const toSvg = (e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  };

  const startDrag = (e: React.PointerEvent, s: Space, mode: Drag["mode"]) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const p = toSvg(e);
    setSelectedId(s.id);
    setDrag({ id: s.id, mode, startX: p.x, startY: p.y, orig: s });
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = toSvg(e);
    const dx = p.x - drag.startX;
    const dy = p.y - drag.startY;
    const o = drag.orig;
    if (drag.mode === "move") {
      upsertSpace({ ...o, x: snap(Math.min(map.width - o.w, Math.max(0, o.x + dx))), y: snap(Math.min(map.height - o.h, Math.max(0, o.y + dy))) });
    } else {
      const w = Math.max(30, snap(o.w + dx));
      const h = o.shape === "circle" && o.w === o.h ? w : Math.max(30, snap(o.h + dy));
      upsertSpace({ ...o, w, h });
    }
  };

  const add = (preset: (typeof PRESETS)[number]) => {
    const n = spaces.filter((s) => s.type === preset.type).length + 1;
    const prefix = { camarote: "Camarote ", area: "Área " }[preset.type];
    const s: Space = {
      id: uid("s_"),
      mapId: map.id,
      label: `${prefix}${n}`,
      type: preset.type,
      x: map.width / 2 - 40,
      y: map.height / 2 - 40,
      rotation: 0,
      bookable: true,
      shape: "rect",
      w: 60,
      h: 60,
      capacity: 4,
      sector: "Pista",
      ...preset.make(),
    };
    upsertSpace(s);
    setSelectedId(s.id);
  };

  const update = (patch: Partial<Space>) => selected && upsertSpace({ ...selected, ...patch });

  const onKey = (e: React.KeyboardEvent) => {
    if (!selected || (e.target as HTMLElement).tagName === "INPUT") return;
    const step = e.shiftKey ? 25 : GRID;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      update({ x: selected.x + moves[e.key][0], y: selected.y + moves[e.key][1] });
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      removeSpace(selected.id);
      setSelectedId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Mapa dos camarotes"
        description="Desenhe os camarotes do salão e da cobertura. Arraste para mover, puxe o canto para redimensionar. Tudo é salvo na hora."
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 1.5 * 1024 * 1024) {
                  toast.error("Use uma imagem de até 1,5 MB.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => updateMap({ ...map, background: String(reader.result) });
                reader.readAsDataURL(f);
              }}
            />
            <Button variant="outline" className="h-9 gap-1.5" onClick={() => fileRef.current?.click()}>
              <ImageUp className="size-4" /> {map.background ? "Trocar planta" : "Enviar planta da casa"}
            </Button>
            {map.background && (
              <Button variant="ghost" className="h-9" onClick={() => updateMap({ ...map, background: undefined })}>
                Remover planta
              </Button>
            )}
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Layers className="size-4 text-muted-foreground" />
        {maps.map((m) => (
          <Button key={m.id} size="sm" variant={m.id === map.id ? "default" : "outline"} onClick={() => (setMapId(m.id), setSelectedId(null))}>
            {m.name}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          className="gap-1"
          onClick={() => {
            const name = prompt("Nome do ambiente", "Mezanino");
            if (name) setMapId(addMap(name));
          }}
        >
          <Plus className="size-3.5" /> Andar
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.type} size="sm" variant="outline" className="gap-1.5" onClick={() => add(p)}>
                <p.icon className="size-3.5" style={{ color: TYPE_COLOR[p.type] }} /> {p.label}
              </Button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/8 bg-[color-mix(in_oklch,var(--background)_80%,black)]" tabIndex={0} onKeyDown={onKey} aria-label="Área de edição do mapa">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${map.width} ${map.height}`}
              className="block w-full min-w-[640px] touch-none select-none"
              onPointerMove={onMove}
              onPointerUp={() => setDrag(null)}
              onPointerDown={() => setSelectedId(null)}
            >
              <defs>
                <pattern id="egrid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M25 0H0V25" fill="none" stroke="oklch(1 0 0 / 6%)" />
                </pattern>
              </defs>
              <rect width={map.width} height={map.height} fill="url(#egrid)" />
              {map.background && <image href={map.background} width={map.width} height={map.height} opacity={0.4} preserveAspectRatio="xMidYMid meet" />}
              {spaces.map((s) => {
                const sel = s.id === selectedId;
                const color = TYPE_COLOR[s.type];
                const cx = s.x + s.w / 2;
                const cy = s.y + s.h / 2;
                return (
                  <g key={s.id} className={cn(drag?.id === s.id ? "cursor-grabbing" : "cursor-grab")}>
                    <g transform={`rotate(${s.rotation} ${cx} ${cy})`} onPointerDown={(e) => startDrag(e, s, "move")}>
                      {s.shape === "circle" ? (
                        <ellipse cx={cx} cy={cy} rx={s.w / 2} ry={s.h / 2} fill={`color-mix(in oklch, ${color} 25%, transparent)`} stroke={sel ? "white" : color} strokeWidth={sel ? 3 : 2} strokeDasharray={s.bookable ? undefined : "6 6"} />
                      ) : (
                        <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={12} fill={`color-mix(in oklch, ${color} ${s.bookable ? 25 : 8}%, transparent)`} stroke={sel ? "white" : color} strokeWidth={sel ? 3 : 2} strokeDasharray={s.bookable ? undefined : "6 6"} />
                      )}
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="pointer-events-none fill-foreground font-semibold" style={{ fontSize: Math.min(18, s.h / 3 + 4) }}>
                        {s.label}
                      </text>
                    </g>
                    {sel && (
                      <rect
                        x={s.x + s.w - 7}
                        y={s.y + s.h - 7}
                        width={14}
                        height={14}
                        rx={3}
                        fill="white"
                        className="cursor-nwse-resize"
                        onPointerDown={(e) => startDrag(e, s, "resize")}
                        aria-label="Redimensionar"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {spaces.filter((s) => s.bookable).length} camarotes neste andar · capacidade total {spaces.reduce((a, s) => a + (s.bookable ? s.capacity : 0), 0)} pessoas
          </p>
        </div>

        <aside className="rounded-2xl border border-white/8 bg-card p-4">
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Propriedades</h2>
                <div className="flex gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Duplicar"
                    onClick={() => {
                      const copy = { ...selected, id: uid("s_"), x: selected.x + 20, y: selected.y + 20, label: `${selected.label}*` };
                      upsertSpace(copy);
                      setSelectedId(copy.id);
                    }}
                  >
                    <Copy />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Excluir"
                    className="text-destructive"
                    onClick={() => {
                      removeSpace(selected.id);
                      setSelectedId(null);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-label">Nome / número</Label>
                <Input id="p-label" value={selected.label} onChange={(e) => update({ label: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="p-type">Tipo</Label>
                  <select id="p-type" className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm [&>option]:bg-popover" value={selected.type} onChange={(e) => update({ type: e.target.value as SpaceType, bookable: e.target.value !== "area" })}>
                    {PRESETS.map((p) => (
                      <option key={p.type} value={p.type}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-shape">Forma</Label>
                  <select id="p-shape" className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm [&>option]:bg-popover" value={selected.shape} onChange={(e) => update({ shape: e.target.value as Space["shape"] })}>
                    <option value="circle">Círculo</option>
                    <option value="rect">Retângulo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="p-sector">Setor</Label>
                  <Input id="p-sector" list="sectors" value={selected.sector} onChange={(e) => update({ sector: e.target.value })} />
                  <datalist id="sectors">
                    {["Salão · lado do jardim", "Salão · lado do bar", "Cobertura"].map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-cap">Capacidade</Label>
                  <Input id="p-cap" type="number" min={0} value={selected.capacity} disabled={!selected.bookable} onChange={(e) => update({ capacity: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="p-w">Largura</Label>
                  <Input id="p-w" type="number" min={20} value={selected.w} onChange={(e) => update({ w: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-h">Altura</Label>
                  <Input id="p-h" type="number" min={20} value={selected.h} onChange={(e) => update({ h: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-rot">Rotação: {selected.rotation}°</Label>
                <input id="p-rot" type="range" min={-180} max={180} step={5} value={selected.rotation} onChange={(e) => update({ rotation: Number(e.target.value) })} className="w-full accent-[var(--primary)]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-desc">Descrição para o cliente</Label>
                <Input id="p-desc" value={selected.description ?? ""} onChange={(e) => update({ description: e.target.value })} placeholder="De frente para o palco" />
              </div>
              <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => toast.info("Na versão final, as fotos vão para o Storage.")}>
                <ImageUp className="size-3.5" /> Adicionar fotos do espaço
              </Button>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Nada selecionado</p>
              <p className="mt-1">Clique em um espaço do mapa ou adicione um novo pela barra acima.</p>
              <ul className="mt-5 space-y-1.5 text-left text-xs">
                {PRESETS.map((p) => (
                  <li key={p.type} className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: TYPE_COLOR[p.type] }} /> {p.label}
                    <span className="ml-auto tabular-nums">{spaces.filter((s) => s.type === p.type).length}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
