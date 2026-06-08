import { aiService } from './ai-services';
import { client } from '@/sanity/lib/client';

// Service to sync startup data with Pinecone vector database
export class AIVectorSync {
  
  // Store a new startup in the vector database
  static async storeStartup(startupId: string): Promise<void> {
    try {
      // Fetch comprehensive startup data from Sanity
      const startup = await client.fetch(`
        *[_type == "startup" && _id == $startupId][0] {
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
      `, { startupId });

      if (!startup) {
        console.error('Startup not found:', startupId);
        return;
      }

      // Store in Pinecone
      await aiService.storeStartupVector(startup);
      console.log('Startup vector stored successfully:', startupId);
    } catch (error) {
      console.error('Error storing startup vector:', error);
    }
  }

  // Update an existing startup in the vector database
  static async updateStartup(startupId: string): Promise<void> {
    try {
      // Fetch comprehensive updated startup data from Sanity
      const startup = await client.fetch(`
        *[_type == "startup" && _id == $startupId][0] {
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
      `, { startupId });

      if (!startup) {
        console.error('Startup not found for update:', startupId);
        return;
      }

      // Update in Pinecone
      await aiService.updateStartupVector(startupId, startup);
      console.log('Startup vector updated successfully:', startupId);
    } catch (error) {
      console.error('Error updating startup vector:', error);
    }
  }

  // Remove a startup from the vector database
  static async deleteStartup(startupId: string): Promise<void> {
    try {
      await aiService.deleteStartupVector(startupId);
      console.log('Startup vector deleted successfully:', startupId);
    } catch (error) {
      console.error('Error deleting startup vector:', error);
    }
  }

  // Bulk sync all startups to Pinecone (useful for initial setup)
  static async syncAllStartups(): Promise<void> {
    try {
      console.log('🚀 Starting comprehensive bulk sync of all startups...');
      
      // Fetch comprehensive startup data
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

      console.log(`📊 Found ${startups.length} startups to sync with comprehensive data`);

      let successCount = 0;
      let errorCount = 0;

      // Store each startup with retry/backoff to avoid GROQ rate limits
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (let i = 0; i < startups.length; i++) {
        const startup = startups[i];
        try {
          console.log(`🔄 Syncing startup ${i + 1}/${startups.length}: ${startup.title}`);
          let attempt = 0;
          let lastError: unknown = null;
          while (attempt < 5) {
            attempt++;
            try {
              await aiService.storeStartupVector(startup);
              successCount++;
              console.log(`✅ Successfully synced: ${startup.title} (attempt ${attempt})`);
              break;
            } catch (err) {
              lastError = err;
              const message = err instanceof Error ? err.message : String(err);
              const isRateLimit = /rate limit/i.test(message);
              console.warn(`⚠️ Sync attempt ${attempt} failed for ${startup.title}: ${message}`);
              if (isRateLimit && attempt < 5) {
                const backoffMs = 1500 * attempt; // linear backoff
                console.log(`⏳ Backing off for ${backoffMs}ms due to rate limit...`);
                await delay(backoffMs);
                continue;
              }
              // Non-rate-limit or max retries reached
              throw err;
            }
          }
          if (successCount + errorCount < i + 1) {
            // If we exited loop without success, count as error
            errorCount++;
            console.error(`❌ Failed to sync after retries: ${startup.title}`, lastError);
          }
          // Pace calls to respect GROQ limits
          await delay(1200);
        } catch (error) {
          errorCount++;
          console.error(`❌ Error syncing startup ${startup._id} (${startup.title}):`, error);
          // Extra pause after a hard failure to be gentle on the API
          await delay(1500);
        }
      }

      console.log(`🎉 Comprehensive bulk sync completed!`);
      console.log(`✅ Successfully synced: ${successCount} startups`);
      console.log(`❌ Failed to sync: ${errorCount} startups`);
      console.log(`📈 Success rate: ${((successCount / startups.length) * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('Error in bulk sync:', error);
    }
  }

  // Sync startups in batches (for large datasets)
  static async syncStartupsBatch(batchSize: number = 50): Promise<void> {
    try {
      console.log('Starting batch sync of startups...');
      
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        // Fetch comprehensive batch of startups
        const startups = await client.fetch(`
          *[_type == "startup"] | order(_createdAt desc) [$offset...$end] {
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
        `, { 
          offset, 
          end: offset + batchSize - 1 
        });

        if (startups.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`Processing batch ${Math.floor(offset / batchSize) + 1} (${startups.length} startups)`);

        // Store each startup in the batch
        for (const startup of startups) {
          try {
            await aiService.storeStartupVector(startup);
          } catch (error) {
            console.error(`Error syncing startup ${startup._id}:`, error);
          }
        }

        offset += batchSize;
        
        // Add a small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('Batch sync completed');
    } catch (error) {
      console.error('Error in batch sync:', error);
    }
  }

  // Get sync status
  static async getSyncStatus(): Promise<{
    totalStartups: number;
    syncedStartups: number;
    lastSync: Date | null;
  }> {
    try {
      // Get total startups from Sanity
      const totalStartups = await client.fetch(`count(*[_type == "startup"])`);
      
      // Note: Pinecone doesn't provide a direct way to count vectors
      // This would need to be tracked separately in your database
      // For now, we'll return the Sanity count
      
      return {
        totalStartups,
        syncedStartups: totalStartups, // This should be tracked separately
        lastSync: new Date() // This should be stored and retrieved from your database
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        totalStartups: 0,
        syncedStartups: 0,
        lastSync: null
      };
    }
  }
}

// Helper function to be called from API routes
export async function syncStartupVector(startupId: string, action: 'create' | 'update' | 'delete'): Promise<void> {
  switch (action) {
    case 'create':
      await AIVectorSync.storeStartup(startupId);
      break;
    case 'update':
      await AIVectorSync.updateStartup(startupId);
      break;
    case 'delete':
      await AIVectorSync.deleteStartup(startupId);
      break;
  }
}

