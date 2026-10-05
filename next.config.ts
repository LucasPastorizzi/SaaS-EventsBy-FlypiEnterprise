import type { NextConfig } from "next";

const brand = process.env.NEXT_PUBLIC_BRAND ?? "inn";

const nextConfig: NextConfig = {
  // esconde o indicador "N" do Next no canto da tela durante o desenvolvimento
  // (erros de compilação continuam aparecendo)
  devIndicators: false,
  // no computador, cada marca compila na própria pasta para as duas rodarem
  // juntas; na Vercel (VERCEL=1) cada projeto é separado e precisa da pasta padrão
  distDir: brand === "inn" || process.env.VERCEL ? ".next" : `.next-${brand}`,
};

export default nextConfig;
