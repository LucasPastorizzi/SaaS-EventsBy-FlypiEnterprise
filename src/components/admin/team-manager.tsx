"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ROLE_DESCRIPTION, ROLE_LABEL, isEmail } from "@/lib/auth";
import { initials } from "@/lib/format";
import { useStaff, useStore } from "@/lib/store";
import type { StaffRole } from "@/lib/types";

const ROLES: StaffRole[] = ["dono", "gerente", "portaria"];
const selectCls = "h-8 rounded-lg border border-input bg-transparent px-2 text-sm [&>option]:bg-popover";

/** Dono cadastra a equipe, troca perfis, desativa e remove acessos. */
export function TeamManager() {
  const staff = useStore((s) => s.staff);
  const me = useStaff();
  const { addStaff, updateStaff, removeStaff } = useStore.getState();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("portaria");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const owners = staff.filter((u) => u.role === "dono" && u.active).length;
  const valid = name.trim().length >= 2 && isEmail(email) && password.length >= 8;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    const res = await addStaff({ name, email, role, password });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`${name.split(" ")[0]} pode entrar em /equipe/entrar com o e-mail e a senha que você definiu.`);
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-white/5 rounded-xl border border-white/8">
        {staff.map((u) => {
          const isMe = u.id === me?.id;
          // não deixa a casa ficar sem nenhum dono ativo
          const lastOwner = u.role === "dono" && u.active && owners <= 1;
          return (
            <li key={u.id} className="flex flex-wrap items-center gap-3 px-3 py-3 text-sm">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold">{initials(u.name)}</span>
              <div className="min-w-40 flex-1">
                <p className="font-medium">
                  {u.name} {isMe && <span className="text-muted-foreground">(você)</span>}
                </p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <select
                aria-label={`Perfil de ${u.name}`}
                className={selectCls}
                value={u.role}
                disabled={isMe || lastOwner}
                onChange={(e) => updateStaff(u.id, { role: e.target.value as StaffRole })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch checked={u.active} disabled={isMe || lastOwner} onCheckedChange={(v) => updateStaff(u.id, { active: !!v })} aria-label={`Acesso de ${u.name} ativo`} />
                {u.active ? "Ativo" : "Desativado"}
              </label>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Remover ${u.name}`}
                disabled={isMe || lastOwner}
                onClick={() => {
                  if (confirm(`Remover o acesso de ${u.name}?`)) {
                    removeStaff(u.id);
                    toast(`Acesso de ${u.name} removido.`);
                  }
                }}
              >
                <Trash2 />
              </Button>
            </li>
          );
        })}
      </ul>

      <ul className="space-y-1 text-xs text-muted-foreground">
        {ROLES.map((r) => (
          <li key={r}>
            <span className="font-medium text-foreground">{ROLE_LABEL[r]}:</span> {ROLE_DESCRIPTION[r]}
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="grid gap-3 rounded-xl border border-white/8 p-3 sm:grid-cols-2">
        <p className="text-sm font-medium sm:col-span-2">Adicionar pessoa</p>
        <div className="space-y-1.5">
          <Label htmlFor="tm-name">Nome</Label>
          <Input id="tm-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tm-email">E-mail</Label>
          <Input id="tm-email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tm-role">Perfil</Label>
          <select id="tm-role" className={`${selectCls} w-full`} value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tm-pass">Senha inicial (mín. 8 caracteres)</Label>
          <Input id="tm-pass" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="gap-1.5 sm:col-span-2 sm:w-fit" disabled={!valid || busy}>
          <Plus className="size-4" /> Adicionar à equipe
        </Button>
      </form>
    </div>
  );
}
