import { InfoPage } from '@/components/InfoPage';
import { EnquiryForm } from '@/components/EnquiryForm';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('asset-owner-enquiries');

export default function Page() {
  return (
    <InfoPage ns="asset-owner-enquiries">
      <EnquiryForm kind="asset-owner" title="Send an enquiry" />
    </InfoPage>
  );
}
