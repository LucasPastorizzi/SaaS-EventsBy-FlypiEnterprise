import Link from "next/link";
import { BRAND } from "@/brand";
import { cn } from "@/lib/utils";

/**
 * Arquivo oficial do logo grande da abertura, por marca. Enquanto for null,
 * o logo é desenhado em tipografia; quando a marca enviar o arquivo, coloque-o
 * em public/brand/ e aponte aqui (ex.: "/brand/movve-logo.svg").
 */
const LOGO_SRC: Record<typeof BRAND.id, string | null> = { inn: null, movve: null };

/** "E" da MOVVE: três barras iguais, sem a haste vertical. */
function MovveE() {
  return (
    <svg viewBox="0 0 60 70" className="inline-block h-[0.72em] w-auto align-baseline" aria-hidden>
      <rect x="0" y="0" width="60" height="12" fill="currentColor" />
      <rect x="0" y="29" width="60" height="12" fill="currentColor" />
      <rect x="0" y="58" width="60" height="12" fill="currentColor" />
    </svg>
  );
}

function MovveType({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-[0.06em] font-extrabold tracking-[0.02em] text-white [font-family:var(--font-wide)]", className)} aria-hidden>
      MOVV
      <MovveE />
    </span>
  );
}

/** Logo pequeno do topo do site, do painel e do login da equipe. */
export function BrandLogo({ className, href = "/" }: { className?: string; href?: string | null }) {
  const content =
    BRAND.id === "movve" ? (
      <span className={cn("inline-flex items-center leading-none", className)}>
        <MovveType className="text-[1.35em]" />
        <span className="sr-only">MOVVE</span>
      </span>
    ) : (
      <span className={cn("inline-flex items-baseline gap-2 leading-none", className)}>
        <span className="font-display text-[1.75em] tracking-[0.04em] text-white" aria-hidden>
          INN
        </span>
        <span className="text-[0.62em] font-medium tracking-[0.32em] text-muted-foreground uppercase">Lounge Bar</span>
        <span className="sr-only">INN Lounge Bar</span>
      </span>
    );
  return href ? (
    <Link href={href} className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {content}
    </Link>
  ) : (
    content
  );
}

/** Logo grande da abertura da página inicial (já com o tamanho de cada marca). */
export function BrandWordmark() {
  const src = LOGO_SRC[BRAND.id];
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arquivo estático do logo, sem otimização necessária
      <img src={src} alt={BRAND.name} className="mx-auto h-32 w-auto md:h-56" />
    );
  }

  if (BRAND.id === "movve")
    return (
      <h1 className="flex flex-col items-center leading-none">
        <MovveType className="text-[4.4rem] sm:text-[6rem] md:text-[8.5rem]" />
        <span className="mt-4 pl-[0.5em] text-xs font-medium tracking-[0.5em] text-white/70 uppercase [font-family:var(--font-sans)] md:text-sm">no INN Lounge Bar</span>
        <span className="sr-only">MOVVE, no INN Lounge Bar</span>
      </h1>
    );

  return (
    <h1 className="flex flex-col items-center text-[10.5rem] leading-none sm:text-[12rem] md:text-[15rem]">
      <span className="font-display leading-[0.8] tracking-[0.02em] text-white" aria-hidden>
        INN
      </span>
      <span className="mt-[0.08em] pl-[0.55em] text-[0.11em] font-medium tracking-[0.55em] text-white/80 uppercase [font-family:var(--font-sans)]" aria-hidden>
        Lounge Bar
      </span>
      <span className="sr-only">INN Lounge Bar</span>
    </h1>
  );
}
