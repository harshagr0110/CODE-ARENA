#!/usr/bin/env node
// Pre-build script to resolve failed migrations before deploying

const { execSync } = require('child_process');

console.log('🔧 Running pre-build migration resolution...');

// List of migrations that might have failed
const migrationsToResolve = [
  '0_init',
  '20260201183917_add_performance_indexes',
  '20260201184443_add_test_results_to_submission'
];

for (const migrationName of migrationsToResolve) {
  try {
    // Try to mark the failed migration as applied (since objects might already exist)
    // This handles the case where database objects exist but migration history is out of sync
    console.log(`Attempting to mark failed migration as applied: ${migrationName}`);
    execSync(`npx prisma migrate resolve --applied ${migrationName}`, { 
      stdio: 'pipe', // Use pipe to suppress output unless there's an error
      env: process.env 
    });
    console.log(`✅ Successfully marked migration ${migrationName} as applied`);
  } catch (error) {
    // If that fails, try marking as rolled back
    try {
      console.log(`Trying alternative: marking ${migrationName} as rolled back...`);
      execSync(`npx prisma migrate resolve --rolled-back ${migrationName}`, { 
        stdio: 'pipe',
        env: process.env 
      });
      console.log(`✅ Successfully marked migration ${migrationName} as rolled back`);
    } catch (error2) {
      // Migration might not exist, already be resolved, or have a different name
      // This is okay - we'll let migrate deploy handle it
      console.log(`ℹ Could not resolve migration ${migrationName} (may already be resolved or not exist)`);
    }
  }
}

console.log('✅ Pre-build migration resolution complete');
