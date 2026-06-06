#!/usr/bin/env node

/**
 * Script to deploy the notification schema to Sanity
 * Run this after setting up your environment variables
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Deploying notification schema to Sanity...\n');

try {
  // Check if we're in the right directory
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = require(packageJsonPath);
  
  if (packageJson.name !== 'foundrly') {
    console.error('❌ This script must be run from the foundrly project root');
    process.exit(1);
  }

  // Check if Sanity CLI is available
  try {
    execSync('sanity --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Sanity CLI not found. Please install it first:');
    console.error('   npm install -g @sanity/cli');
    process.exit(1);
  }

  // Deploy the schema
  console.log('📋 Deploying schema...');
  execSync('sanity schema deploy', { stdio: 'inherit' });
  
  console.log('\n✅ Schema deployed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Make sure your .env.local file has the required Sanity variables:');
  console.log('   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id');
  console.log('   NEXT_PUBLIC_SANITY_DATASET=production');
  console.log('   NEXT_PUBLIC_SANITY_API_VERSION=2025-01-02');
  console.log('   SANITY_WRITE_TOKEN=your_write_token');
  console.log('\n2. Restart your development server');
  console.log('3. Test the notification system');

} catch (error) {
  console.error('❌ Failed to deploy schema:', error.message);
  console.error('\n💡 Make sure you have:');
  console.error('   - Set up your .env.local file with Sanity credentials');
  console.error('   - Logged in to Sanity CLI (sanity login)');
  console.error('   - Proper permissions for your Sanity project');
  process.exit(1);
}
