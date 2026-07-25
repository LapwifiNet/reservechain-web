import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('cookie');

export default function Page() {
  return <InfoPage ns="cookie" notice="draft" narrow />;
}
