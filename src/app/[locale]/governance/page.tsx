import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('governance');

export default function Page() {
  return <InfoPage ns="governance" />;
}
