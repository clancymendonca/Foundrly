import { createClient } from 'next-sanity';

import { apiVersion, dataset, projectId } from '../env';

/** Fresh reads for badge catalog — avoid CDN staleness after seed/schema changes. */
export const badgeReadClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
});
