#!/usr/bin/env node

/**
 * Re-sync Vector Database Script
 * 
 * This script re-syncs all startup vectors with improved embedding generation
 * to enhance search accuracy.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Enable requiring TypeScript modules when running under Node
try {
  require('ts-node').register({ transpileOnly: true });
} catch (e) {
  // ts-node may not be installed in prod; the script will fail gracefully below if so
}

// Load modules (supports TS via ts-node/register)
function loadModules() {
  const { client } = require('../sanity/lib/client');
  const { aiService } = require('../lib/ai-services');
  return { client, aiService };
}

async function resyncAllVectors() {
  console.log('🚀 Starting comprehensive vector re-sync with enhanced embeddings...\n');
  console.log('This will use all startup fields for better semantic search results.\n');

  try {
    const { client, aiService } = loadModules();
    // Fetch comprehensive startup data from Sanity
    const startups = await client.fetch(`
      *[_type == "startup"] {
        _id,
        title,
        description,
        category,
        pitch,
        author->{name, username, _id},
        _createdAt,
        _updatedAt,
        views,
        likes,
        dislikes,
        tags,
        status,
        fundingStage,
        teamSize,
        location,
        website,
        socialLinks,
        "imageUrl": image.asset->url,
        "logoUrl": logo.asset->url
      }
    `);

    console.log(`📊 Found ${startups.length} startups to re-sync with comprehensive data\n`);

    let successCount = 0;
    let errorCount = 0;

    // Process startups in batches
    const batchSize = 10;
    for (let i = 0; i < startups.length; i += batchSize) {
      const batch = startups.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(startups.length / batchSize)} (${batch.length} startups)`);
      
      // Process each startup in the batch
      for (const startup of batch) {
        try {
          // Store with improved embedding
          await aiService.storeStartupVector(startup);
          successCount++;
          console.log(`  ✅ ${startup.title}`);
        } catch (error) {
          errorCount++;
          console.error(`  ❌ ${startup.title}: ${error.message}`);
        }
      }
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < startups.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n🎉 Comprehensive re-sync completed!`);
    console.log(`✅ Successfully synced: ${successCount} startups`);
    console.log(`❌ Errors: ${errorCount} startups`);
    console.log(`📈 Success rate: ${((successCount / startups.length) * 100).toFixed(1)}%`);
    console.log(`\n🔍 Enhanced embeddings now include:`);
    console.log(`   - Full title, description, and pitch`);
    console.log(`   - Category and tags`);
    console.log(`   - Author information`);
    console.log(`   - Status and funding stage`);
    console.log(`   - Team size and location`);
    console.log(`   - Engagement metrics`);
    console.log(`   - Creation date`);
    console.log(`\n🎯 Your semantic search should now be much more accurate!`);
    console.log(`   Try searching for "farming related apps" to see the improvement.`);
    
    if (errorCount > 0) {
      console.log(`\n⚠️  Some startups failed to sync. Check the errors above.`);
    }

  } catch (error) {
    console.error('❌ Re-sync failed:', error);
    process.exit(1);
  }
}

// Run the re-sync
resyncAllVectors().then(() => {
  console.log('\n🚀 Vector re-sync completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('Re-sync script failed:', error);
  process.exit(1);
});
