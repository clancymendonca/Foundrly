/**
* This configuration file lets you run `$ sanity [command]` in this folder
* Go to https://www.sanity.io/docs/cli to learn more.
**/
import { config as loadEnv } from 'dotenv'
import { defineCliConfig } from 'sanity/cli'

loadEnv({ path: '.env.local', override: true })
loadEnv({ override: true })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

export default defineCliConfig({ api: { projectId, dataset } })
