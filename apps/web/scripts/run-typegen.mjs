import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

import './load-local-env.mjs'

const extractPath = './sanity/extract.json'

function run(command, args) {
  return spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })
}

const extract = run('npx', [
  'sanity',
  'schema',
  'extract',
  `--path=${extractPath}`,
])

if (extract.status !== 0) {
  if (!existsSync(extractPath)) {
    console.error(
      '\nSchema extract failed and no cached sanity/extract.json was found.',
    )
    console.error(
      'Log in with "npx sanity login" and add http://localhost:3000 to CORS origins, then retry.',
    )
    process.exit(extract.status ?? 1)
  }

  console.warn(
    '\nSchema extract skipped (using cached sanity/extract.json).',
  )
  console.warn(
    'If you changed Sanity schema types, run "npx sanity login" and "npm run typegen:extract".',
  )
}

const generate = run('npx', [
  'sanity',
  'typegen',
  'generate',
  `--schema-path=${extractPath}`,
])

process.exit(generate.status ?? 1)
