import { InfoPage } from '@/components/InfoPage';
import { EnquiryForm } from '@/components/EnquiryForm';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('enterprise');

export default function Page() {
  return (
    <InfoPage ns="enterprise">
      <EnquiryForm kind="enterprise" title="Send an enquiry" />
    </InfoPage>
  );
}
