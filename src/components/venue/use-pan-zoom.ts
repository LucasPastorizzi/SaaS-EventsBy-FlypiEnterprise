"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface View {
  x: number;
  y: number;
  k: number;
}

const MIN = 1;
const MAX = 4;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Pan + zoom para um <svg> com viewBox fixo. Suporta pinça com dois dedos,
 * arrastar com um dedo/mouse e roda do mouse. Diferencia "tap" de "arrasto"
 * para não selecionar uma mesa sem querer ao mover o mapa.
 */
export function usePanZoom(width: number, height: number) {
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const ref = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; k: number; cx: number; cy: number; vx: number; vy: number } | null>(null);
  const moved = useRef(0);

  const bound = useCallback(
    (v: View): View => {
      const k = clamp(v.k, MIN, MAX);
      return { k, x: clamp(v.x, -(width * k - width), 0), y: clamp(v.y, -(height * k - height), 0) };
    },
    [width, height],
  );

  /** converte pixels da tela em unidades do viewBox */
  const scale = () => {
    const el = ref.current;
    if (!el) return 1;
    return width / el.getBoundingClientRect().width;
  };

  const zoomAt = useCallback(
    (factor: number, cx = width / 2, cy = height / 2) =>
      setView((v) => {
        const k = clamp(v.k * factor, MIN, MAX);
        const f = k / v.k;
        return bound({ k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f });
      }),
    [bound, width, height],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = 0;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const rect = ref.current!.getBoundingClientRect();
      const s = scale();
      gesture.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        k: view.k,
        cx: ((a.x + b.x) / 2 - rect.left) * s,
        cy: ((a.y + b.y) / 2 - rect.top) * s,
        vx: view.x,
        vy: view.y,
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);
    const s = scale();

    if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()];
      const g = gesture.current;
      const k = clamp((g.k * Math.hypot(a.x - b.x, a.y - b.y)) / g.dist, MIN, MAX);
      const f = k / g.k;
      moved.current += 10;
      setView(bound({ k, x: g.cx - (g.cx - g.vx) * f, y: g.cy - (g.cy - g.vy) * f }));
      return;
    }
    const dx = (cur.x - prev.x) * s;
    const dy = (cur.y - prev.y) * s;
    moved.current += Math.abs(dx) + Math.abs(dy);
    if (view.k > 1) setView((v) => bound({ ...v, x: v.x + dx, y: v.y + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
  };

  // listener nativo (não passivo) para poder impedir o zoom da página inteira
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // só com ctrl/⌘ (pinça do trackpad); a roda sozinha continua rolando a página
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const s = width / rect.width;
      zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, (e.clientX - rect.left) * s, (e.clientY - rect.top) * s);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt, width]);

  /** true se o último gesto foi um arrasto (então ignorar o clique) */
  const wasDrag = () => moved.current > 8;

  return {
    ref,
    view,
    zoomIn: () => zoomAt(1.4),
    zoomOut: () => zoomAt(1 / 1.4),
    reset: () => setView({ x: 0, y: 0, k: 1 }),
    wasDrag,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
