import PortalAuthForm from "../PortalAuthForm";
import { routeMetadata } from "@/lib/meta";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return routeMetadata('/portal/register', params.locale);
}


export const dynamic = "force-dynamic";

export default function PortalRegisterPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return <PortalAuthForm mode="register" locale={locale} />;
}
