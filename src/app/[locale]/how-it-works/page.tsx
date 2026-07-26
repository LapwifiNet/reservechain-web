import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('how-it-works');

export default function Page() {
  return <InfoPage ns="how-it-works" notice="proposed" />;
}
