import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { BRAND } from "@/brand";

export const metadata: Metadata = { title: { default: "Painel", template: `%s · Painel ${BRAND.short}` } };

export default function Layout({ children }: LayoutProps<"/painel">) {
  return <AdminShell>{children}</AdminShell>;
}
