import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('enterprise');

export default function Page() {
  return <InfoPage ns="enterprise" />;
}
