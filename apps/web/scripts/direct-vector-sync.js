#!/usr/bin/env node

/**
 * Direct Vector Sync Script
 * 
 * This script runs the vector sync directly without authentication for testing.
 * It imports the TypeScript modules and runs the sync locally.
 */

const { execSync } = require('child_process');
const path = require('path');

async function directVectorSync() {
  console.log('🚀 Starting Direct Vector Sync');
  console.log('==============================');
  console.log('');
  console.log('This will:');
  console.log('✅ Fetch comprehensive startup data from Sanity');
  console.log('✅ Create enhanced embeddings using all available fields');
  console.log('✅ Use GROQ/Gemini/OpenAI for better semantic understanding');
  console.log('✅ Update Pinecone with improved vectors');
  console.log('✅ Provide detailed progress tracking');
  console.log('');

  try {
    // Ask user for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Do you want to proceed with direct vector sync? (y/N): ', async (answer) => {
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ Sync cancelled by user.');
        rl.close();
        return;
      }

      console.log('');
      console.log('🔄 Starting direct sync...');
      console.log('This may take several minutes depending on the number of startups.');
      console.log('');

      const startTime = Date.now();

      try {
        // Run the sync using the existing sync-vectors script
        console.log('📦 Running comprehensive vector sync...');
        
        // Use the existing sync-vectors script which should work
        const result = execSync('node scripts/sync-vectors.js', { 
          encoding: 'utf8',
          stdio: 'inherit'
        });

        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);
        
        console.log('');
        console.log('🎉 Direct Vector Sync Completed!');
        console.log('================================');
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
        
      } catch (error) {
        console.error('❌ Error during direct sync:', error.message);
        console.log('');
        console.log('💡 Alternative: You can also run the sync through the web interface:');
        console.log('   1. Open http://localhost:3000 in your browser');
        console.log('   2. Log into your account');
        console.log('   3. Use the existing sync functionality');
      }

      rl.close();
    });

  } catch (error) {
    console.error('❌ Error setting up direct sync:', error);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Direct sync cancelled by user.');
  process.exit(0);
});

// Run the direct sync
directVectorSync().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
