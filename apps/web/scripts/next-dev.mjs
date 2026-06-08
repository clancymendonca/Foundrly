import { spawnSync } from 'node:child_process'

import './load-local-env.mjs'

const firebaseConfig = spawnSync('node', ['scripts/generate-firebase-config.mjs'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

if (firebaseConfig.status !== 0) {
  process.exit(firebaseConfig.status ?? 1)
}

const typegen = spawnSync('npm', ['run', 'typegen'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

if (typegen.status !== 0) {
  process.exit(typegen.status ?? 1)
}

const dev = spawnSync('npx', ['next', 'dev', '-p', '3000'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

process.exit(dev.status ?? 1)
