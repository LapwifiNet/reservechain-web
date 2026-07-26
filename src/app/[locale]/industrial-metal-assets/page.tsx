import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('industrial-metal-assets');

export default function Page() {
  return <InfoPage ns="industrial-metal-assets" notice="provisional" />;
}
