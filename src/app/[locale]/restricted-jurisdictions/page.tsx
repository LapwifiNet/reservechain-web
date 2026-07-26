import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('restricted-jurisdictions');

export default function Page() {
  return <InfoPage ns="restricted-jurisdictions" notice="draft" narrow />;
}
