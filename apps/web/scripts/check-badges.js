require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@sanity/client");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

async function run() {
  const cdn = createClient({ projectId, dataset, useCdn: true, apiVersion: "2025-01-02" });
  const fresh = createClient({ projectId, dataset, useCdn: false, apiVersion: "2025-01-02" });

  const query = `*[_type == "badge" && isActive == true]{ _id, name, metric, levels }`;
  const [cdnBadges, freshBadges] = await Promise.all([
    cdn.fetch(query),
    fresh.fetch(query),
  ]);

  console.log("CDN badges:", cdnBadges.length);
  console.log("Fresh badges:", freshBadges.length);
  if (freshBadges[0]) console.log("Sample:", freshBadges[0].name);
}

run().catch(console.error);
