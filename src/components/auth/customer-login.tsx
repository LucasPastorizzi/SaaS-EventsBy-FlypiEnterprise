"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isEmail, newCode, onlyDigits } from "@/lib/auth";
import { maskPhone } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { CustomerAccount } from "@/lib/types";
import { cn } from "@/lib/utils";

type Channel = "whatsapp" | "email";
type Step = "contato" | "codigo" | "cadastro";

const CODE_TTL = 5 * 60_000;
const RESEND_AFTER = 30_000;
const MAX_ATTEMPTS = 5;

/**
 * Login do cliente sem senha: código de 6 dígitos pelo WhatsApp ou e-mail.
 * Na demonstração o "envio" é um aviso na tela; no backend, Supabase Auth
 * (OTP por SMS/WhatsApp e e-mail) envia de verdade e valida no servidor.
 */
export function CustomerLogin({ onDone, title = "Entrar", subtitle }: { onDone: (c: CustomerAccount) => void; title?: string; subtitle?: string }) {
  const { findCustomer, signInCustomer, createCustomer } = useStore.getState();
  const [step, setStep] = useState<Step>("contato");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState<{ code: string; at: number; attempts: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (step !== "codigo") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step]);

  const contactValid = channel === "whatsapp" ? onlyDigits(contact).length >= 10 : isEmail(contact);
  const contactKey = channel === "whatsapp" ? { phone: contact } : { email: contact };
  const resendIn = sent ? Math.max(0, Math.ceil((sent.at + RESEND_AFTER - now) / 1000)) : 0;

  const send = () => {
    if (!contactValid) return;
    setBusy(true);
    // simula o tempo de envio da mensagem
    setTimeout(() => {
      const c = newCode();
      setSent({ code: c, at: Date.now(), attempts: 0 });
      setNow(Date.now());
      setCode("");
      setStep("codigo");
      setBusy(false);
      toast(`${channel === "whatsapp" ? "WhatsApp" : "E-mail"} (simulado): seu código do INN é ${c}`, {
        description: "Na versão final, o código chega de verdade e não aparece aqui.",
        duration: 15_000,
      });
    }, 700);
  };

  const verify = (value: string) => {
    if (!sent) return;
    if (Date.now() - sent.at > CODE_TTL) {
      toast.error("O código expirou. Peça um novo.");
      return;
    }
    if (sent.attempts >= MAX_ATTEMPTS) {
      toast.error("Muitas tentativas. Peça um novo código.");
      return;
    }
    if (value !== sent.code) {
      setSent({ ...sent, attempts: sent.attempts + 1 });
      setCode("");
      toast.error(`Código incorreto. ${MAX_ATTEMPTS - sent.attempts - 1} tentativas restantes.`);
      return;
    }
    const existing = findCustomer(contactKey);
    if (existing) {
      signInCustomer(existing.id);
      toast.success(`Bem-vindo de volta, ${existing.name.split(" ")[0]}!`);
      onDone(existing);
    } else setStep("cadastro");
  };

  const finish = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3 || !terms) return;
    const c = createCustomer({ name, marketing, ...(channel === "whatsapp" ? { phone: contact } : { email: contact }) });
    toast.success(`Conta criada. Boa noite, ${c.name.split(" ")[0]}!`);
    onDone(c);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-3xl">{step === "cadastro" ? "Como podemos te chamar?" : title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "contato" && (subtitle ?? "Sem senha: mandamos um código para você entrar.")}
          {step === "codigo" && `Digite o código de 6 dígitos enviado para ${channel === "whatsapp" ? maskPhone(contact) : contact}.`}
          {step === "cadastro" && "Primeira vez por aqui. É rapidinho."}
        </p>
      </div>

      {step === "contato" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <div className="grid grid-cols-2 rounded-xl bg-white/[0.05] p-1" role="tablist" aria-label="Como receber o código">
            {(
              [
                { k: "whatsapp", label: "WhatsApp", icon: MessageCircle },
                { k: "email", label: "E-mail", icon: Mail },
              ] as const
            ).map((t) => (
              <button
                key={t.k}
                type="button"
                role="tab"
                aria-selected={channel === t.k}
                onClick={() => {
                  setChannel(t.k);
                  setContact("");
                }}
                className={cn("flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition", channel === t.k ? "bg-background shadow" : "text-muted-foreground")}
              >
                <t.icon className="size-4" /> {t.label}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-contact">{channel === "whatsapp" ? "Seu WhatsApp" : "Seu e-mail"}</Label>
            {channel === "whatsapp" ? (
              <Input id="login-contact" autoFocus inputMode="tel" autoComplete="tel" placeholder="(51) 90000-0000" className="h-12 text-base" value={contact} onChange={(e) => setContact(maskPhone(e.target.value))} />
            ) : (
              <Input id="login-contact" autoFocus type="email" autoComplete="email" placeholder="voce@email.com" className="h-12 text-base" value={contact} onChange={(e) => setContact(e.target.value)} />
            )}
          </div>
          <Button type="submit" className="h-12 w-full text-base" disabled={!contactValid || busy}>
            {busy ? <Loader2 className="animate-spin" /> : "Receber código"}
          </Button>
        </form>
      )}

      {step === "codigo" && (
        <div className="space-y-4">
          <Input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="Código de 6 dígitos"
            maxLength={6}
            className="h-14 text-center font-mono text-3xl tracking-[0.5em]"
            value={code}
            onChange={(e) => {
              const v = onlyDigits(e.target.value).slice(0, 6);
              setCode(v);
              if (v.length === 6) verify(v);
            }}
          />
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={() => setStep("contato")} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" /> Trocar {channel === "whatsapp" ? "número" : "e-mail"}
            </button>
            <button type="button" disabled={resendIn > 0 || busy} onClick={send} className="text-muted-foreground hover:text-foreground disabled:opacity-50">
              {resendIn > 0 ? `Reenviar em ${resendIn}s` : "Reenviar código"}
            </button>
          </div>
        </div>
      )}

      {step === "cadastro" && (
        <form className="space-y-4" onSubmit={finish}>
          <div className="space-y-1.5">
            <Label htmlFor="signup-name">Nome completo</Label>
            <Input id="signup-name" autoFocus autoComplete="name" className="h-12 text-base" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <label className="flex items-start gap-2.5 text-sm">
            <Checkbox checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="mt-0.5" />
            <span>
              Li e aceito os <a className="underline">termos de uso</a> e a <a className="underline">política de privacidade</a>.
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <Checkbox checked={marketing} onCheckedChange={(v) => setMarketing(!!v)} className="mt-0.5" />
            <span>Quero receber a programação do INN pelo WhatsApp (opcional).</span>
          </label>
          <Button type="submit" className="h-12 w-full text-base" disabled={name.trim().length < 3 || !terms}>
            Criar conta e continuar
          </Button>
        </form>
      )}
    </div>
  );
}
