import PortalAuthForm from "../PortalAuthForm";
import { routeMetadata } from "@/lib/meta";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return routeMetadata('/portal/login', params.locale);
}


export const dynamic = "force-dynamic";

export default function PortalLoginPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return <PortalAuthForm mode="login" locale={locale} />;
}
