import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

export const studioReadClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})
