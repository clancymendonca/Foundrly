#!/usr/bin/env node

/**
 * Startup Sync Script
 * 
 * This script syncs all startups from Sanity to Pinecone vector database.
 * Run with: node scripts/sync-startups.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Pinecone } = require('@pinecone-database/pinecone');
const { createClient } = require('@sanity/client');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function syncStartups() {
  console.log('🔄 Starting startup sync from Sanity to Pinecone...\n');

  // Initialize services
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
  });

  try {
    // Get Pinecone index
    const index = pinecone.index('foundrly-startups');
    console.log('✅ Connected to Pinecone index');

    // Fetch all startups from Sanity
    console.log('📥 Fetching startups from Sanity...');
    const startups = await sanity.fetch(`
      *[_type == "startup"] {
        _id,
        title,
        description,
        category,
        pitch,
        author->{name, username},
        _createdAt,
        views,
        likes,
        dislikes
      }
    `);

    console.log(`📊 Found ${startups.length} startups in Sanity`);

    if (startups.length === 0) {
      console.log('⚠️  No startups found in Sanity database');
      return;
    }

    // Process each startup
    console.log('🔄 Processing startups...');
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < startups.length; i++) {
      const startup = startups[i];
      console.log(`Processing ${i + 1}/${startups.length}: ${startup.title}`);

      try {
        // Create text for embedding
        const text = `${startup.title} ${startup.description || ''} ${startup.category || ''}`;
        
        // Generate embedding with fallback
        let embedding;
        try {
          const model = genAI.getGenerativeModel({ model: 'embedding-001' });
          const result = await model.embedContent(text);
          embedding = result.embedding.values;
        } catch (error) {
          console.log(`  ⚠️  Gemini failed for ${startup.title}, trying OpenAI...`);
          
          // Try OpenAI fallback
          if (process.env.OPENAI_API_KEY) {
            try {
              const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'text-embedding-3-small',
                  input: text,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                embedding = data.data[0].embedding;
                console.log(`  ✅ OpenAI fallback successful for ${startup.title}`);
              } else {
                throw new Error(`OpenAI API error: ${response.status}`);
              }
            } catch (openaiError) {
              console.error(`  ❌ OpenAI also failed for ${startup.title}:`, openaiError.message);
              continue; // Skip this startup
            }
          } else {
            console.error(`  ❌ No OpenAI API key configured, skipping ${startup.title}`);
            continue; // Skip this startup
          }
        }

        // Store in Pinecone
        await index.upsert([{
          id: startup._id,
          values: embedding,
          metadata: {
            _id: startup._id,
            title: startup.title,
            description: startup.description || '',
            category: startup.category || '',
            author: startup.author?.name || startup.author?.username || 'Unknown',
            views: startup.views || 0,
            likes: startup.likes || 0,
            dislikes: startup.dislikes || 0,
            _createdAt: startup._createdAt,
            text: text
          }
        }]);

        successCount++;
        console.log(`  ✅ Synced: ${startup.title}`);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Failed to sync ${startup.title}:`, error.message);
      }
    }

    console.log('\n🎉 Sync completed!');
    console.log(`✅ Successfully synced: ${successCount} startups`);
    console.log(`❌ Failed to sync: ${errorCount} startups`);

    // Verify sync
    console.log('\n🔍 Verifying sync...');
    const stats = await index.describeIndexStats();
    console.log(`📊 Total vectors in Pinecone: ${stats.totalVectorCount}`);

    if (stats.totalVectorCount > 0) {
      console.log('\n🎯 Your AI features should now work!');
      console.log('Visit: http://localhost:3000/ai-features');
      console.log('Try searching for startups using natural language!');
    }

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Run the sync
syncStartups().then(() => {
  console.log('\n✨ Sync script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
