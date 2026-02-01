#!/usr/bin/env node
// Pre-build script to resolve failed migrations before deploying

const { execSync } = require('child_process');

console.log('🔧 Running pre-build migration resolution...');

try {
  // Try to resolve the failed 0_init migration
  // This will only succeed if the migration actually failed and needs to be resolved
  console.log('Attempting to resolve failed migration: 0_init');
  execSync('npx prisma migrate resolve --rolled-back 0_init', { 
    stdio: 'inherit',
    env: process.env 
  });
  console.log('✅ Successfully resolved failed migration');
} catch (error) {
  // Migration might not exist, already be resolved, or have a different name
  // This is okay - we'll let migrate deploy handle it
  console.log('ℹ Could not resolve migration (may already be resolved or not exist)');
  console.log('   Continuing with migration deploy...');
}

console.log('✅ Pre-build migration resolution complete');
