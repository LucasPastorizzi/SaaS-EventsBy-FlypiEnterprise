"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { HOME_OF, canAccess, justSignedOut } from "@/lib/auth";
import { useHydrated, useStaff } from "@/lib/store";

/**
 * Protege as telas da equipe no navegador: sem login vai para /equipe/entrar,
 * e cada perfil só abre o que pode. Com backend, a regra se repete no servidor
 * (proxy do Next + RLS); esta trava sozinha não é segurança.
 */
export function StaffGuard({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const staff = useStaff();
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !staff) router.replace(justSignedOut() ? "/equipe/entrar" : `/equipe/entrar?next=${encodeURIComponent(path)}`);
  }, [hydrated, staff, path, router]);

  if (!hydrated || !staff)
    return (
      <div className="grid min-h-screen place-items-center bg-black" aria-busy="true">
        <span className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );

  if (!canAccess(staff.role, path))
    return (
      <div className="grid min-h-[60vh] place-items-center px-4 text-center">
        <div>
          <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-display text-2xl">Sem acesso a esta área</p>
          <p className="mt-1 text-sm text-muted-foreground">Seu perfil não pode abrir esta página. Fale com o dono da casa se precisar.</p>
          <Link href={HOME_OF[staff.role]} className="mt-4 inline-block text-sm underline">
            Ir para a minha tela
          </Link>
        </div>
      </div>
    );

  return <>{children}</>;
}
