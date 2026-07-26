import PortalAuthForm from "../PortalAuthForm";

export const dynamic = "force-dynamic";

export default function PortalLoginPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return <PortalAuthForm mode="login" locale={locale} />;
}
