import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = { title: { default: "Painel", template: "%s · Painel INN" } };

export default function Layout({ children }: LayoutProps<"/painel">) {
  return <AdminShell>{children}</AdminShell>;
}
