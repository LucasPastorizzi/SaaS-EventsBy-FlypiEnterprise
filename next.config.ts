import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // esconde o indicador "N" do Next no canto da tela durante o desenvolvimento
  // (erros de compilação continuam aparecendo)
  devIndicators: false,
};

export default nextConfig;
