"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Flyer } from "@/components/flyer";
import { compressImage } from "@/lib/image";
import type { EventItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export const MAX_PHOTOS = 8;

/** Arrastar arquivos para a área também funciona no computador. */
function useDropZone(onFiles: (files: File[]) => void) {
  const [over, setOver] = useState(false);
  return {
    over,
    props: {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setOver(false);
        onFiles([...e.dataTransfer.files].filter((f) => f.type.startsWith("image/")));
      },
    },
  };
}

/** Capa da noite: imagem real escolhida da galeria / câmera / computador. */
export function CoverPicker({ event, onChange }: { event: EventItem; onChange: (patch: Partial<EventItem>) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange({ cover: await compressImage(file, 1080), coverShowTitle: event.coverShowTitle ?? false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível usar esta imagem.");
    } finally {
      setBusy(false);
    }
  };
  const drop = useDropZone((files) => void pick(files[0]));

  return (
    <div className="mx-auto w-full max-w-52 space-y-2 sm:max-w-none">
      <button
        type="button"
        onClick={() => input.current?.click()}
        {...drop.props}
        aria-label={event.cover ? "Trocar a imagem da noite" : "Escolher a imagem da noite"}
        className={cn(
          "group relative block w-full overflow-hidden rounded-xl ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          drop.over && "ring-2 ring-primary",
        )}
      >
        <Flyer event={{ ...event, name: event.name || "Sua noite" }} size="sm" className="aspect-[4/5]" />
        <span className="absolute inset-0 grid place-items-center bg-black/55 text-sm font-medium opacity-0 transition md:group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="flex flex-col items-center gap-1.5">
            {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
            {event.cover ? "Trocar imagem" : "Escolher imagem"}
          </span>
        </span>
        {busy && <span className="absolute inset-0 grid place-items-center bg-black/55"><Loader2 className="size-6 animate-spin" /></span>}
      </button>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => void pick(e.target.files?.[0]).then(() => (e.target.value = ""))} />

      <Button type="button" variant={event.cover ? "outline" : "default"} size="sm" className="w-full gap-1.5" onClick={() => input.current?.click()} disabled={busy}>
        <ImagePlus className="size-3.5" /> {event.cover ? "Trocar imagem" : "Imagem da galeria"}
      </Button>
      {event.cover ? (
        <>
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" className="mt-0.5 size-3.5 accent-[var(--primary)]" checked={event.coverShowTitle ?? false} onChange={(e) => onChange({ coverShowTitle: e.target.checked })} />
            Escrever nome e data por cima (deixe desligado se a arte já tem o texto)
          </label>
          <Button type="button" variant="ghost" size="sm" className="w-full gap-1.5 text-muted-foreground" onClick={() => onChange({ cover: undefined })}>
            <Trash2 className="size-3.5" /> Usar flyer desenhado
          </Button>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Use o flyer da noite ou uma foto. No celular, abre a galeria ou a câmera.</p>
      )}
    </div>
  );
}

/** Fotos reais da noite (edições anteriores, ambiente, atrações). */
export function PhotosPicker({ photos, onChange }: { photos: string[]; onChange: (photos: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);

  const add = async (files: File[]) => {
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      toast.error(`Máximo de ${MAX_PHOTOS} fotos por noite.`);
      return;
    }
    const chosen = files.slice(0, room);
    if (files.length > room) toast.info(`Só cabem mais ${room} fotos; as primeiras foram adicionadas.`);
    setBusy(chosen.length);
    const out: string[] = [];
    for (const f of chosen) {
      try {
        out.push(await compressImage(f, 1000, 0.75));
      } catch {
        toast.error(`Não foi possível usar ${f.name}.`);
      }
      setBusy((n) => n - 1);
    }
    onChange([...photos, ...out]);
  };
  const drop = useDropZone((files) => void add(files));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">Fotos da noite</p>
        <span className="text-xs text-muted-foreground">
          {photos.length}/{MAX_PHOTOS}
        </span>
      </div>
      <div {...drop.props} className={cn("grid grid-cols-4 gap-2 rounded-xl p-0.5 sm:grid-cols-5", drop.over && "ring-2 ring-primary")}>
        {photos.map((src, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-lg bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL local */}
            <img src={src} alt={`Foto ${i + 1}`} className="size-full object-cover" />
            <button
              type="button"
              aria-label={`Remover foto ${i + 1}`}
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/70 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {Array.from({ length: busy }, (_, i) => (
          <div key={`b${i}`} className="grid aspect-square place-items-center rounded-lg bg-white/5">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ))}
        {photos.length + busy < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="grid aspect-square place-items-center rounded-lg border border-dashed border-white/20 text-muted-foreground transition hover:border-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label="Adicionar fotos da galeria"
          >
            <span className="flex flex-col items-center gap-1 text-[11px]">
              <ImagePlus className="size-5" /> Adicionar
            </span>
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void add([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
      <p className="mt-1.5 text-xs text-muted-foreground">Aparecem na página da noite para o cliente. Dá para escolher várias de uma vez ou arrastar para cá.</p>
    </div>
  );
}
