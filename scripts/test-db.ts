import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import { projects } from '../src/db/schema';

async function testConnection() {
  try {
    console.log('Testing database connection...\n');

    // Test 1: Basic connection
    const result = await db.execute(sql`SELECT current_database(), version()`);
    console.log('✅ Database connected:', result[0]);

    // Test 2: Check tables exist
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log('\n✅ Tables created:');
    tables.forEach((r) => console.log(`   - ${(r as { table_name: string }).table_name}`));

    // Test 3: Insert test data
    console.log('\n📝 Testing insert operation...');
    const testProject = await db.insert(projects).values({
      id: 'test_001',
      xero_project_id: 'xero_test_001',
      name: 'Test Project',
      client_name: 'Test Client',
      tracking_category_id: 'track_001',
      status: 'active',
      is_active: true,
    }).returning();
    console.log('✅ Test project inserted:', testProject[0].name);

    // Test 4: Query data
    const allProjects = await db.select().from(projects);
    console.log(`✅ Query successful: Found ${allProjects.length} project(s)`);

    // Test 5: Clean up
    await db.execute(sql`DELETE FROM projects WHERE id = 'test_001'`);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All database operations working correctly!');
    console.log('   Drizzle ORM is properly configured with the milestone database.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

testConnection();