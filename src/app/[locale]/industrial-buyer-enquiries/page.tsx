import { InfoPage } from '@/components/InfoPage';
import { EnquiryForm } from '@/components/EnquiryForm';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('industrial-buyer-enquiries');

export default function Page() {
  return (
    <InfoPage ns="industrial-buyer-enquiries">
      <EnquiryForm kind="industrial-buyer" title="Send an enquiry" />
    </InfoPage>
  );
}
