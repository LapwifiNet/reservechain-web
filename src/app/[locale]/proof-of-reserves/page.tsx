import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('proof-of-reserves');

export default function Page() {
  return <InfoPage ns="proof-of-reserves" notice="proposed" />;
}
