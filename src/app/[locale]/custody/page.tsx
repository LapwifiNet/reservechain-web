import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('custody');

export default function Page() {
  return <InfoPage ns="custody" notice="proposed" />;
}
