#!/usr/bin/env node
// Pre-build script to resolve failed migrations before deploying

const { execSync } = require('child_process');

console.log('🔧 Running pre-build migration resolution...');

try {
  // Try to mark the failed 0_init migration as applied (since objects already exist)
  // This handles the case where database objects exist but migration history is out of sync
  console.log('Attempting to mark failed migration as applied: 0_init');
  execSync('npx prisma migrate resolve --applied 0_init', { 
    stdio: 'inherit',
    env: process.env 
  });
  console.log('✅ Successfully marked migration as applied');
} catch (error) {
  // If that fails, try marking as rolled back
  try {
    console.log('Trying alternative: marking as rolled back...');
    execSync('npx prisma migrate resolve --rolled-back 0_init', { 
      stdio: 'inherit',
      env: process.env 
    });
    console.log('✅ Successfully marked migration as rolled back');
  } catch (error2) {
    // Migration might not exist, already be resolved, or have a different name
    // This is okay - we'll let migrate deploy handle it
    console.log('ℹ Could not resolve migration (may already be resolved or not exist)');
    console.log('   Continuing with migration deploy...');
  }
}

console.log('✅ Pre-build migration resolution complete');
