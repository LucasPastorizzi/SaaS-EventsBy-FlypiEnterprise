import type { Metadata, Viewport } from "next";
import { Anton, Inter, Montserrat } from "next/font/google";
import { BRAND } from "@/brand";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const anton = Anton({ variable: "--font-display", subsets: ["latin"], weight: "400" });
// letra larga do logo da MOVVE
const montserrat = Montserrat({ variable: "--font-wide", subsets: ["latin"], weight: ["800"] });

export const metadata: Metadata = {
  title: { default: BRAND.metaTitle, template: `%s · ${BRAND.name}` },
  description: BRAND.metaDescription,
  icons: { icon: BRAND.icon },
};

// Os dados de demo usam datas relativas a "hoje"; renderizar por requisição evita HTML
// estático com datas do dia do build.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: BRAND.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" data-brand={BRAND.id} className={`dark ${inter.variable} ${anton.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
