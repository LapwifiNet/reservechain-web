import { WaitlistForm } from './WaitlistForm';
import { routeMetadata } from '@/lib/meta';

export function generateMetadata({ params }: { params: { locale: string } }) {
  return routeMetadata('/waitlist', params.locale);
}

export default function WaitlistPage() {
  return <WaitlistForm />;
}
