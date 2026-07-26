import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('anti-fraud');

export default function Page() {
  return <InfoPage ns="anti-fraud" notice="draft" narrow />;
}
