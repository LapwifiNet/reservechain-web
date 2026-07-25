import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('roadmap');

export default function Page() {
  return <InfoPage ns="roadmap" />;
}
