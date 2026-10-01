// Regras de acesso e utilitários de login. Nesta fase só de front-end,
// sessão e contas ficam no navegador: serve para a demonstração, não é
// segurança de verdade. No backend, isso vira Supabase Auth (OTP por
// WhatsApp/e-mail para clientes, e-mail e senha para a equipe) + RLS.
import type { StaffRole } from "./types";

export const ROLE_LABEL: Record<StaffRole, string> = {
  dono: "Dono",
  gerente: "Gerente",
  portaria: "Portaria",
};

export const ROLE_DESCRIPTION: Record<StaffRole, string> = {
  dono: "Acesso total: reservas, noites, mapa, configurações e equipe",
  gerente: "Confirma reservas, cuida das noites e faz check-in",
  portaria: "Só o leitor de QR Code da entrada",
};

/** Páginas que cada perfil pode abrir (prefixos de rota). */
const ACCESS: Record<StaffRole, string[]> = {
  dono: ["/painel", "/portaria"],
  gerente: ["/painel", "/painel/reservas", "/painel/eventos", "/portaria"],
  portaria: ["/portaria"],
};

export function canAccess(role: StaffRole, path: string) {
  if (role === "dono") return true;
  return ACCESS[role].some((p) => (p === "/painel" ? path === "/painel" : path === p || path.startsWith(p + "/")));
}

/** Primeira tela de cada perfil depois do login. */
export const HOME_OF: Record<StaffRole, string> = { dono: "/painel", gerente: "/painel", portaria: "/portaria" };

export async function hashPassword(email: string, password: string) {
  const data = new TextEncoder().encode(`inn:${email.trim().toLowerCase()}:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onlyDigits = (s: string) => s.replace(/\D/g, "");
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

/** Código de 6 dígitos (demo). No backend, quem gera e envia é o provedor de OTP. */
export function newCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(n).padStart(6, "0");
}

/** Só aceita voltar para caminhos internos (evita redirecionar para outro site). */
export function safeNext(next: string | null | undefined, fallback = "/") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/**
 * Marca quando alguém da equipe saiu de propósito, para a trava das páginas
 * não guardar "voltar para esta tela" (quem entrar depois cai na própria tela).
 */
export const signOutMarker = { at: 0 };
export const justSignedOut = () => Date.now() - signOutMarker.at < 3000;
