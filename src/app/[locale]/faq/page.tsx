import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('faq');

export default function Page() {
  return <InfoPage ns="faq" />;
}
