import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('contact');

export default function Page() {
  return <InfoPage ns="contact" />;
}
