import "server-only";
import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId, token } from '../env'

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, 
  token,
})

if (!token || !writeClient.config().token) {
  throw new Error("Missing SANITY_WRITE_TOKEN. The app will not run correctly and likes/dislikes will not be saved. Please add it to your .env.local file.");
}
