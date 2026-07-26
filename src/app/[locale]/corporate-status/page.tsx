import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('corporate-status');

export default function Page() {
  return <InfoPage ns="corporate-status" />;
}
