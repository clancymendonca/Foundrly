#!/usr/bin/env node

/**
 * Comprehensive Vector Sync Script
 * 
 * This script performs a complete re-sync of all startup vectors with enhanced data.
 * It fetches comprehensive startup information and creates better embeddings.
 */

const fetch = require('node-fetch');

async function makeRequest(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data };
  } catch (error) {
    return { error: error.message };
  }
}

async function comprehensiveVectorSync() {
  console.log('🚀 Starting Comprehensive Vector Sync');
  console.log('=====================================');
  console.log('');
  console.log('This will:');
  console.log('✅ Fetch comprehensive startup data (title, description, pitch, category, tags, etc.)');
  console.log('✅ Create enhanced embeddings using all available fields');
  console.log('✅ Use GROQ/Gemini/OpenAI for better semantic understanding');
  console.log('✅ Update Pinecone with improved vectors');
  console.log('✅ Provide detailed progress tracking');
  console.log('');

  try {
    // Check server status
    console.log('🔍 Checking server status...');
    const statusCheck = await makeRequest('http://localhost:3000/api/dev/ai/test-sync', {
      method: 'GET'
    });

    if (statusCheck.error || !statusCheck.response?.ok) {
      console.log('❌ Server not responding. Please:');
      console.log('1. Make sure the server is running (npm run dev)');
      console.log('2. Check that port 3000 is available');
      console.log('3. Run this script again\n');
      process.exit(1);
    }

    console.log('✅ Server is running!');
    console.log(`📊 Total startups in database: ${statusCheck.data.status?.totalStartups || 'Unknown'}`);
    console.log('');

    // Ask user for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Do you want to proceed with comprehensive vector sync? (y/N): ', async (answer) => {
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ Sync cancelled by user.');
        rl.close();
        return;
      }

      console.log('');
      console.log('🔄 Starting comprehensive sync...');
      console.log('This may take several minutes depending on the number of startups.');
      console.log('');

      const startTime = Date.now();

      try {
        // Perform comprehensive bulk sync via API
        const syncResult = await makeRequest('http://localhost:3000/api/dev/ai/test-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'sync-all'
          })
        });

        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);
        
        if (syncResult.error) {
          console.log('❌ Error:', syncResult.error);
        } else if (syncResult.data.success) {
          console.log('');
          console.log('🎉 Comprehensive Vector Sync Completed!');
          console.log('=====================================');
          console.log(`⏱️  Total time: ${duration} seconds`);
          console.log('✅ All startup vectors have been updated with comprehensive data');
          console.log('✅ Enhanced embeddings now include:');
          console.log('   - Full title, description, and pitch');
          console.log('   - Category and tags');
          console.log('   - Author information');
          console.log('   - Status and funding stage');
          console.log('   - Team size and location');
          console.log('   - Engagement metrics');
          console.log('   - Creation date');
          console.log('');
          console.log('🔍 Your semantic search should now be much more accurate!');
          console.log('   Try searching for "farming related apps" to see the improvement.');
        } else {
          console.log('❌ Sync failed:', syncResult.data.message);
        }
        
      } catch (error) {
        console.error('❌ Error during comprehensive sync:', error);
      }

      rl.close();
    });

  } catch (error) {
    console.error('❌ Error checking sync status:', error);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Comprehensive sync cancelled by user.');
  process.exit(0);
});

// Run the comprehensive sync
comprehensiveVectorSync().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
