import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('terms');

export default function Page() {
  return <InfoPage ns="terms" notice="draft" narrow />;
}
