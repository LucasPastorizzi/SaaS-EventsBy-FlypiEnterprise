"use client";

import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { TeamManager } from "@/components/admin/team-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";


function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-white/5 py-6 md:grid-cols-[260px_1fr]">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const venue = useStore((s) => s.venue);
  const { updateVenue, resetDemo } = useStore.getState();

  return (
    <>
      <PageHeader title="Configurações" description="O que mudar aqui aparece na hora no site de reservas." />

      <Section title="Informações da casa" description="Textos e contatos da página inicial.">
        <div className="space-y-1.5">
          <Label htmlFor="v-tag">Frase de destaque</Label>
          <Input id="v-tag" value={venue.tagline} onChange={(e) => updateVenue({ tagline: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-desc">Sobre a casa</Label>
          <Textarea id="v-desc" rows={3} value={venue.description} onChange={(e) => updateVenue({ description: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="v-hours">Horário</Label>
            <Input id="v-hours" value={venue.hours} onChange={(e) => updateVenue({ hours: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-phone">WhatsApp de atendimento</Label>
            <Input id="v-phone" value={venue.phone} onChange={(e) => updateVenue({ phone: e.target.value })} />
          </div>
        </div>
      </Section>

      <Section title="Regras da reserva" description="Aplicadas no site e na tela da reserva.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="v-hold">Tempo para preencher os dados (min)</Label>
            <Input id="v-hold" type="number" min={2} max={60} value={venue.holdMinutes} onChange={(e) => updateVenue({ holdMinutes: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-cancel">Cliente pode cancelar até (horas antes)</Label>
            <Input id="v-cancel" type="number" min={0} value={venue.cancelHours} onChange={(e) => updateVenue({ cancelHours: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-arrival">Titular chega até</Label>
            <Input id="v-arrival" value={venue.arrivalLimit} onChange={(e) => updateVenue({ arrivalLimit: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-age">Idade mínima</Label>
            <Input id="v-age" type="number" min={0} value={venue.minAge} onChange={(e) => updateVenue({ minAge: Number(e.target.value) })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-rules">Regras da casa (uma por linha)</Label>
          <Textarea id="v-rules" rows={4} value={venue.rules.join("\n")} onChange={(e) => updateVenue({ rules: e.target.value.split("\n").filter(Boolean) })} />
        </div>
      </Section>

      <Section title="Equipe e acessos" description="Quem entra no painel e na portaria, e o que cada um pode fazer.">
        <TeamManager />
      </Section>

      <Section title="Dados da demonstração" description="Volta reservas, noites, mapa e textos ao estado inicial.">
        <Button
          variant="outline"
          className="w-fit gap-1.5"
          onClick={() => {
            if (confirm("Restaurar todos os dados de demonstração?")) {
              resetDemo();
              toast.success("Demonstração restaurada.");
            }
          }}
        >
          <RotateCcw className="size-4" /> Restaurar demonstração
        </Button>
      </Section>
    </>
  );
}
