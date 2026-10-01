import { GuestInvite } from "@/components/ticket/guest-invite";

export const metadata = { title: "Convite" };

export default async function Page({ params }: PageProps<"/convite/[code]">) {
  const { code } = await params;
  return <GuestInvite code={code} />;
}
