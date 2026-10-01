"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

/** Faixa de fotos reais da noite + visualização em tela cheia. */
export function EventPhotos({ photos, title }: { photos: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  if (!photos.length) return null;

  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl">Fotos da noite</h2>
      <div className="no-scrollbar -mx-4 mt-3 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
        {photos.map((src, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            className="relative h-36 w-28 shrink-0 snap-start overflow-hidden rounded-xl bg-white/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:h-44 sm:w-36"
            aria-label={`Ver foto ${i + 1} de ${photos.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL local */}
            <img src={src} alt="" className="size-full object-cover transition hover:scale-105" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`${title}: foto ${open + 1} de ${photos.length}`}
            onClick={() => setOpen(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL local */}
            <img src={photos[open]} alt={`${title}, foto ${open + 1}`} className="max-h-full max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
            <button onClick={() => setOpen(null)} aria-label="Fechar" className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white">
              <X className="size-5" />
            </button>
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen((open - 1 + photos.length) % photos.length);
                  }}
                  aria-label="Foto anterior"
                  className="absolute left-3 grid size-10 place-items-center rounded-full bg-white/10 text-white"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen((open + 1) % photos.length);
                  }}
                  aria-label="Próxima foto"
                  className="absolute right-3 grid size-10 place-items-center rounded-full bg-white/10 text-white"
                >
                  <ChevronRight className="size-5" />
                </button>
                <p className="absolute bottom-5 text-sm text-white/70">
                  {open + 1} / {photos.length}
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
