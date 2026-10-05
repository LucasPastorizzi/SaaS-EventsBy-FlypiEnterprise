"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HOME_OF, ROLE_LABEL, canAccess, safeNext } from "@/lib/auth";
import { DEMO_STAFF_LOGINS } from "@/lib/mock-data";
import { useHydrated, useStaff, useStore } from "@/lib/store";

const MAX_FAILS = 5;
const LOCK_MS = 60_000;

export function StaffSignIn() {
  const hydrated = useHydrated();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const staff = useStaff();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // já logado: vai para a tela do perfil (ou para onde tentava ir, se puder)
  useEffect(() => {
    if (!hydrated || !staff) return;
    const target = safeNext(next, HOME_OF[staff.role]);
    router.replace(canAccess(staff.role, target.split("?")[0]) ? target : HOME_OF[staff.role]);
  }, [hydrated, staff, next, router]);

  useEffect(() => {
    if (lockedUntil <= now) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lockedUntil, now]);

  const locked = lockedUntil > now;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || busy) return;
    setBusy(true);
    setError("");
    const res = await useStore.getState().signInStaff(email, password);
    setBusy(false);
    if (res.ok) {
      toast.success(`Olá, ${res.user.name.split(" ")[0]}!`);
      return; // o efeito acima redireciona
    }
    const f = fails + 1;
    setFails(f);
    setPassword("");
    if (f >= MAX_FAILS) {
      setLockedUntil(Date.now() + LOCK_MS);
      setNow(Date.now());
      setFails(0);
      setError("Muitas tentativas. Aguarde 1 minuto para tentar de novo.");
    } else setError(res.error);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <BrandLogo href="/" className="text-2xl" />
          <p className="mt-3 text-sm text-muted-foreground">Acesso da equipe</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-white/10 bg-card p-6" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="staff-email">E-mail</Label>
            <Input id="staff-email" type="email" autoComplete="username" autoFocus className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-pass">Senha</Label>
            <div className="relative">
              <Input id="staff-pass" type={show ? "text" : "password"} autoComplete="current-password" className="h-11 pr-11" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Esconder senha" : "Mostrar senha"}
                className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {locked ? `Muitas tentativas. Tente de novo em ${Math.ceil((lockedUntil - now) / 1000)}s.` : error}
            </p>
          )}
          <Button type="submit" className="h-11 w-full bg-white text-black hover:bg-white/85" disabled={!email || !password || busy || locked}>
            {busy ? <Loader2 className="animate-spin" /> : (
              <>
                <Lock className="size-4" /> Entrar
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Esqueceu a senha? Peça ao dono da casa para redefinir.</p>
        </form>

        {DEMO_STAFF_LOGINS.length > 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-4">
            <p className="text-xs text-muted-foreground">Demonstração: entrar como</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {DEMO_STAFF_LOGINS.map((d) => (
                <Button
                  key={d.role}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword(d.password);
                    setError("");
                  }}
                >
                  {ROLE_LABEL[d.role]}
                </Button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Voltar ao site
          </Link>
        </p>
      </div>
    </main>
  );
}
