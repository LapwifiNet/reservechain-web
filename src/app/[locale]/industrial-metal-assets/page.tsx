import { InfoPage } from '@/components/InfoPage';
import { ProgramGrid } from '@/components/ProgramGrid';
import { listPrograms } from '@/lib/cms';
import { pageMetadata } from '@/lib/meta';

export const generateMetadata = pageMetadata('industrial-metal-assets');

/**
 * SC-WEB-ASSETS — the page that describes the asset programs in prose now also
 * lists the ones the CMS actually publishes.
 *
 * The prose and the grid have to agree, and the grid is the half that can
 * change without a deploy: an editor publishing a third program while the copy
 * below still names two is the failure mode to watch for. `revalidate` bounds
 * how long the two can disagree, and matches /passports and /corporate-status.
 */
export const revalidate = 300;

export default async function Page() {
  const programs = await listPrograms();
  return (
    <InfoPage ns="industrial-metal-assets" notice="provisional">
      <ProgramGrid programs={programs} />
    </InfoPage>
  );
}
