import { Suspense } from "react";
import { TicketView } from "@/components/ticket/ticket-view";

export const metadata = { title: "Sua reserva" };

export default async function Page({ params }: PageProps<"/reserva/[id]">) {
  const { id } = await params;
  return (
    <Suspense>
      <TicketView id={id} />
    </Suspense>
  );
}
