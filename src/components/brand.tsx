import Link from "next/link";
import { cn } from "@/lib/utils";

/** Marca INN em tipografia condensada (substituir pelo arquivo oficial do logo quando a casa enviar). */
export function InnLogo({ className, href = "/", sub = true }: { className?: string; href?: string | null; sub?: boolean }) {
  const content = (
    <span className={cn("inline-flex items-baseline gap-2 leading-none", className)}>
      <span className="font-display text-[1.75em] tracking-[0.04em] text-white" aria-hidden>
        INN
      </span>
      {sub && <span className="text-[0.62em] font-medium tracking-[0.32em] text-muted-foreground uppercase">Lounge Bar</span>}
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

/** Fios de luz verdes, como os pendurados entre as plantas da casa. */
export function StringLights({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 60" preserveAspectRatio="none" className={cn("pointer-events-none", className)} aria-hidden>
      <path d="M0 8 Q 100 52 200 14 T 400 10" fill="none" stroke="oklch(1 0 0 / 15%)" strokeWidth="1" />
      {Array.from({ length: 16 }, (_, i) => {
        const t = (i + 0.5) / 16;
        const x = t * 400;
        const y = t < 0.5 ? 8 + Math.sin(t * 2 * Math.PI) * 26 + t * 12 : 14 + Math.sin((t - 0.5) * 2 * Math.PI) * -6;
        return <circle key={i} cx={Math.round(x * 10) / 10} cy={Math.round((y + 3) * 10) / 10} r="2.6" className="animate-pulse" style={{ fill: i % 5 === 2 ? "var(--violet)" : "var(--primary)", animationDelay: `${(i % 4) * 0.4}s`, filter: "drop-shadow(0 0 4px currentColor)" }} />;
      })}
    </svg>
  );
}
