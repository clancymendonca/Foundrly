export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-01-02'

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET'
)

export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID'
)

const PLACEHOLDER_SANITY_PROJECT_IDS = new Set(['abc12345', 'your_project_id'])

if (PLACEHOLDER_SANITY_PROJECT_IDS.has(projectId)) {
  throw new Error(
    'NEXT_PUBLIC_SANITY_PROJECT_ID is set to a placeholder value. Update .env.local with your Sanity project ID from https://sanity.io/manage'
  )
}

export const token = process.env.SANITY_WRITE_TOKEN;

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }

  return v
}
