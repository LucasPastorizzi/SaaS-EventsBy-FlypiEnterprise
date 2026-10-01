import Link from "next/link";
import { AtSign, MessageCircle, Ticket } from "lucide-react";
import { InnLogo } from "@/components/brand";
import { VENUE } from "@/lib/mock-data";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <InnLogo className="text-base" />
        <nav className="flex items-center gap-2">
          <Link
            href="/minhas-reservas"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3 text-sm text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Ticket className="size-4" /> <span className="hidden sm:inline">Minhas reservas</span>
            <span className="sm:hidden">Reservas</span>
          </Link>
          <Link
            href="/#noites"
            className="hidden h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none sm:inline-flex"
          >
            Reservar camarote
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <InnLogo className="text-base" />
          <p className="mt-2 text-sm text-muted-foreground">
            {VENUE.address} · {VENUE.district}, {VENUE.city}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`https://instagram.com/${VENUE.instagram}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram do INN" className="grid size-10 place-items-center rounded-full border border-white/10 hover:border-white/30">
            <AtSign className="size-4" />
          </a>
          <a href={`https://wa.me/${VENUE.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp do INN" className="grid size-10 place-items-center rounded-full border border-white/10 hover:border-white/30">
            <MessageCircle className="size-4" />
          </a>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-6xl px-4 text-xs text-muted-foreground/70">Sistema de reservas por Flypi Enterprise</p>
    </footer>
  );
}
