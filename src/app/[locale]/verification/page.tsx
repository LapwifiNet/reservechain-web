import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('verification');

export default function Page() {
  return <InfoPage ns="verification" notice="proposed" />;
}
