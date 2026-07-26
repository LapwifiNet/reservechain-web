import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('asset-owner-enquiries');

export default function Page() {
  return <InfoPage ns="asset-owner-enquiries" />;
}
