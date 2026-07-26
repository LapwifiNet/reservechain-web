import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('industrial-buyer-enquiries');

export default function Page() {
  return <InfoPage ns="industrial-buyer-enquiries" />;
}
