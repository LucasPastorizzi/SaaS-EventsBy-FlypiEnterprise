import { Suspense } from "react";
import { CustomerSignInPage } from "@/components/auth/customer-sign-in-page";

export const metadata = { title: "Entrar" };

export default function Page() {
  return (
    <Suspense>
      <CustomerSignInPage />
    </Suspense>
  );
}
