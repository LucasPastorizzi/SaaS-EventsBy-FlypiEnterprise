import type { NextConfig } from "next";

const brand = process.env.NEXT_PUBLIC_BRAND ?? "inn";

const nextConfig: NextConfig = {
  // esconde o indicador "N" do Next no canto da tela durante o desenvolvimento
  // (erros de compilação continuam aparecendo)
  devIndicators: false,
  // cada marca compila na própria pasta, para as duas versões rodarem juntas
  distDir: brand === "inn" ? ".next" : `.next-${brand}`,
};

export default nextConfig;
