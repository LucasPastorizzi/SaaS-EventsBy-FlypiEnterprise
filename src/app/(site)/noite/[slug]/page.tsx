import { BookingFlow } from "@/components/booking/booking-flow";

export default async function Page({ params }: PageProps<"/noite/[slug]">) {
  const { slug } = await params;
  return <BookingFlow eventSlug={slug} />;
}
