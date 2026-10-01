import { Suspense } from "react";
import { StaffSignIn } from "@/components/auth/staff-sign-in";

export const metadata = { title: "Acesso da equipe" };

export default function Page() {
  return (
    <Suspense>
      <StaffSignIn />
    </Suspense>
  );
}
