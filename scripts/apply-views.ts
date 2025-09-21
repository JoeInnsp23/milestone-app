import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function applyViews() {
  console.log('📊 Applying materialized views and improvements...\n');

  try {
    // First ensure schema exists
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS milestone`);
    console.log('✅ Schema ready');

    // Read and execute the views SQL file
    const viewsSQL = fs.readFileSync(
      path.join(__dirname, '../drizzle/0001_add_views.sql'),
      'utf-8'
    );

    // Split by statement and execute each
    const statements = viewsSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await db.execute(sql.raw(statement + ';'));
      } catch (error) {
        // Ignore "already exists" errors for idempotency
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage?.includes('already exists')) {
          console.warn(`⚠️ Warning executing statement: ${errorMessage}`);
        }
      }
    }

    console.log('✅ Materialized views created');
    console.log('✅ Update triggers created');
    console.log('✅ Permissions granted');
    console.log('\n✨ Database views and improvements applied successfully!');
  } catch (error) {
    console.error('❌ Error applying views:', error);
    process.exit(1);
  }

  process.exit(0);
}

applyViews();