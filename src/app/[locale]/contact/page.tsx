import { InfoPage } from '@/components/InfoPage';
import { EnquiryForm } from '@/components/EnquiryForm';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('contact');

export default function Page() {
  return (
    <InfoPage ns="contact">
      <EnquiryForm kind="contact" title="Send an enquiry" />
    </InfoPage>
  );
}
