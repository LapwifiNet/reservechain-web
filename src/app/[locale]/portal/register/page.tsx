import PortalAuthForm from "../PortalAuthForm";

export const dynamic = "force-dynamic";

export default function PortalRegisterPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return <PortalAuthForm mode="register" locale={locale} />;
}
