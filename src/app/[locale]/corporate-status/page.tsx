import { InfoPage } from '@/components/InfoPage';
import { StatusChips } from '@/components/StatusChips';
import { pageMetadata } from '@/lib/meta';
import { projectStatusFromCms } from '@/lib/status';

export const generateMetadata = pageMetadata('corporate-status');

/**
 * SC-WEB-STATUS — the page that states the project's stage in prose now also
 * renders the three D5 chips, from CMS state.
 *
 * The chips and the copy below them have to agree, and the chips are the half
 * that can change without a deploy: an admin advancing `publication` to
 * "Published" while this page still says nothing is published is the failure
 * mode to watch for. The scales are deliberately short so that stays
 * checkable by reading the page.
 */
export const revalidate = 300;

export default async function Page() {
  const status = await projectStatusFromCms();
  return (
    <InfoPage ns="corporate-status">
      <StatusChips status={status} />
    </InfoPage>
  );
}
