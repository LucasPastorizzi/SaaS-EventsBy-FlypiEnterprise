import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const anton = Anton({ variable: "--font-display", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: { default: "INN Lounge Bar · Reserva de camarotes", template: "%s · INN Lounge Bar" },
  description: "Reserve seu camarote no INN Lounge Bar, em Hamburgo Velho, Novo Hamburgo. Escolha o lugar no mapa e receba o QR Code de entrada.",
};

// Os dados de demo usam datas relativas a "hoje"; renderizar por requisição evita HTML
// estático com datas do dia do build.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#0b100e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`dark ${inter.variable} ${anton.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
