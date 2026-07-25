import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('tokenization');

export default function Page() {
  return <InfoPage ns="tokenization" notice="proposed" />;
}
