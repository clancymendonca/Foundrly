#!/usr/bin/env node

/**
 * Vector Sync CLI Tool
 * 
 * This script helps you sync vectors using the API endpoint.
 * You'll need to be logged in to your Foundrly account.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function makeRequest(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data };
  } catch (error) {
    return { error: error.message };
  }
}

async function syncVectors() {
  console.log('🔄 Foundrly Vector Sync Tool\n');
  console.log('This tool will re-sync all startup vectors with improved embeddings.');
  console.log('You must be logged into your Foundrly account in your browser.\n');

  // Check if user is logged in
  console.log('🔍 Checking authentication...');
  const authCheck = await makeRequest('http://localhost:3000/api/ai/sync-vectors', {
    method: 'GET'
  });

  if (authCheck.error || !authCheck.response?.ok) {
    console.log('❌ Authentication failed. Please:');
    console.log('1. Open your browser and go to http://localhost:3000');
    console.log('2. Log into your Foundrly account');
    console.log('3. Run this script again\n');
    process.exit(1);
  }

  console.log('✅ Authentication successful!\n');

  // Ask user for sync type
  rl.question('Choose sync type:\n1. Sync all vectors (recommended)\n2. Sync in batches\nEnter choice (1 or 2): ', async (choice) => {
    let action, message;
    
    if (choice === '1') {
      action = 'sync-all';
      message = '🔄 Syncing all vectors...';
    } else if (choice === '2') {
      action = 'sync-batch';
      message = '📦 Syncing vectors in batches...';
    } else {
      console.log('❌ Invalid choice. Please run the script again and choose 1 or 2.');
      rl.close();
      return;
    }

    console.log(`\n${message}`);
    console.log('This may take a few minutes. Please wait...\n');

    const syncOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: action,
        ...(action === 'sync-batch' && { batchSize: 25 })
      })
    };

    const result = await makeRequest('http://localhost:3000/api/ai/sync-vectors', syncOptions);

    if (result.error) {
      console.log('❌ Error:', result.error);
    } else if (result.data.success) {
      console.log('✅ Success:', result.data.message);
      console.log('\n🎉 Vector sync completed! Your AI search should now be much more accurate.');
    } else {
      console.log('❌ Sync failed:', result.data.message);
    }

    rl.close();
  });
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Sync cancelled by user.');
  rl.close();
  process.exit(0);
});

// Run the sync
syncVectors().catch(error => {
  console.error('❌ Script failed:', error);
  rl.close();
  process.exit(1);
});
