import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('official-channels');

export default function Page() {
  return <InfoPage ns="official-channels" notice="draft" narrow />;
}
