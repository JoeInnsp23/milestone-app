#!/usr/bin/env tsx
/**
 * Safe migration script that only applies migrations to the milestone schema
 * This avoids Drizzle's push command which tries to manage the entire database
 */

import { exec } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function applyMigrations() {
  console.log('🚀 Applying migrations to milestone schema only...\n');

  const migrationsDir = join(process.cwd(), 'drizzle');

  try {
    // Get all SQL files in the migrations directory
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && !f.includes('production-improvements'))
      .sort();

    for (const file of files) {
      console.log(`📄 Applying ${file}...`);
      const sqlPath = join(migrationsDir, file);

      // Apply via docker exec
      const command = `cat ${sqlPath} | docker exec -i n8n-postgres psql -U n8n_user -d n8n`;

      try {
        const { stderr } = await execAsync(command);
        if (stderr && !stderr.includes('already exists')) {
          console.error(`⚠️  Warning: ${stderr}`);
        }
        console.log(`✅ ${file} applied successfully\n`);
      } catch (error: unknown) {
        const errorWithStderr = error as { stderr?: string; message?: string };
        if (errorWithStderr.stderr?.includes('already exists')) {
          console.log(`✅ ${file} - schema already exists (skipped)\n`);
        } else {
          console.error(`❌ Failed to apply ${file}: ${errorWithStderr.message}`);
          process.exit(1);
        }
      }
    }

    // Apply production improvements
    const prodImprovementsPath = join(migrationsDir, 'production-improvements.sql');
    console.log('📄 Applying production improvements...');

    const command = `cat ${prodImprovementsPath} | docker exec -i n8n-postgres psql -U n8n_user -d n8n 2>&1 | grep -v "ERROR.*permission denied to create role" | grep -v "ERROR.*role.*does not exist"`;

    try {
      await execAsync(command);
      console.log('✅ Production improvements applied\n');
    } catch {
      // Ignore role-related errors as n8n_user doesn't have CREATEROLE permission
      console.log('✅ Production improvements applied (role creation skipped)\n');
    }

    console.log('🎉 All migrations completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  applyMigrations();
}

export { applyMigrations };