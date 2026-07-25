import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('redemption');

export default function Page() {
  return <InfoPage ns="redemption" notice="proposed" />;
}
