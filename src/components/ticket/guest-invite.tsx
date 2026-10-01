"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flyer } from "@/components/flyer";
import { fullDate, hideCpf, maskCpf } from "@/lib/format";
import { isActive, uid, useHydrated, useStore } from "@/lib/store";

/** Página que o convidado abre pelo link compartilhado pelo titular. */
export function GuestInvite({ code }: { code: string }) {
  const hydrated = useHydrated();
  const r = useStore((s) => s.reservations.find((x) => x.code === code.toUpperCase()));
  const event = useStore((s) => s.events.find((e) => e.id === r?.eventId));
  const space = useStore((s) => s.spaces.find((x) => x.id === r?.spaceId));
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [done, setDone] = useState(false);

  if (!hydrated) return null;
  if (!r || !event || !space || !isActive(r)) return <p className="py-24 text-center text-muted-foreground">Convite inválido ou expirado.</p>;
  const full = r.guests.length >= r.partySize;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-card">
        <Flyer event={event} className="h-40" />
        <div className="p-5">
          <p className="text-sm text-muted-foreground">{r.holderName} chamou você para o</p>
          <h1 className="font-display text-4xl">{space.label}</h1>
          <p className="text-sm text-muted-foreground">
            {event.name} · {fullDate(event.startsAt)}
          </p>

          {done ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/15 text-primary">
                <Check className="size-7" strokeWidth={3} />
              </div>
              <p className="mt-3 font-display text-2xl">Seu nome está na lista</p>
              <p className="mt-1 text-sm text-muted-foreground">Na entrada, diga que é do {space.label} e mostre um documento com foto.</p>
            </motion.div>
          ) : full ? (
            <p className="mt-5 rounded-xl bg-white/5 p-4 text-sm">A lista deste camarote já está completa. Fale com {r.holderName.split(" ")[0]}.</p>
          ) : (
            <form
              className="mt-5 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                useStore.getState().setGuests(r.id, [...r.guests, { id: uid("g_"), name: name.trim(), cpfMasked: hideCpf(cpf) || undefined }]);
                setDone(true);
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="gname">Seu nome completo</Label>
                <Input id="gname" required className="h-11" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gcpf">CPF</Label>
                <Input id="gcpf" required inputMode="numeric" className="h-11 font-mono" value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} />
                <p className="text-xs text-muted-foreground">Usado só para conferir sua entrada. Guardado com segurança.</p>
              </div>
              <Button type="submit" className="h-12 w-full text-base" disabled={name.trim().length < 3 || cpf.replace(/\D/g, "").length !== 11}>
                Entrar na lista
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
