import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('risk-disclosure');

export default function Page() {
  return <InfoPage ns="risk-disclosure" notice="draft" narrow />;
}
