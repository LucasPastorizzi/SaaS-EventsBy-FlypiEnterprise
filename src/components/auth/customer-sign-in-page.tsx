"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerLogin } from "@/components/auth/customer-login";
import { safeNext } from "@/lib/auth";
import { useCustomer, useHydrated } from "@/lib/store";

export function CustomerSignInPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"), "/minhas-reservas");
  const customer = useCustomer();

  // já logado: segue para onde ia
  useEffect(() => {
    if (hydrated && customer) router.replace(next);
  }, [hydrated, customer, next, router]);

  if (!hydrated || customer) return <div className="mx-auto mt-16 h-80 max-w-sm animate-pulse rounded-3xl bg-white/5" />;

  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <div className="glass rounded-3xl p-6">
        <CustomerLogin onDone={() => router.replace(next)} subtitle="Entre para reservar camarotes e ver suas reservas. Sem senha: mandamos um código." />
      </div>
    </main>
  );
}
