import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('legal-structure');

export default function Page() {
  return <InfoPage ns="legal-structure" notice="proposed" />;
}
