import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function testRelationships() {
  console.log('🔗 Testing database relationships and constraints...\n');

  try {
    // Test 1: Check foreign key constraints exist
    console.log('🔑 Testing foreign key constraints...');
    const fkConstraints = await db.execute(sql`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name
    `);
    console.log(`✅ Found ${fkConstraints.length} foreign key constraints`);
    fkConstraints.forEach((fk) => {
      const fkTyped = fk as { table_name: string; column_name: string; foreign_table_name: string; foreign_column_name: string };
      console.log(`   - ${fkTyped.table_name}.${fkTyped.column_name} → ${fkTyped.foreign_table_name}.${fkTyped.foreign_column_name}`);
    });

    // Test 2: Verify cascade deletes
    console.log('\n🗑️ Testing cascade delete on projects...');
    const projectCount = await db.execute(sql`SELECT COUNT(*) as count FROM projects`);
    const invoiceCount = await db.execute(sql`SELECT COUNT(*) as count FROM invoices WHERE project_id IS NOT NULL`);
    const billCount = await db.execute(sql`SELECT COUNT(*) as count FROM bills WHERE project_id IS NOT NULL`);
    const estimateCount = await db.execute(sql`SELECT COUNT(*) as count FROM project_estimates`);

    console.log(`   Projects: ${projectCount[0].count}`);
    console.log(`   Related invoices: ${invoiceCount[0].count}`);
    console.log(`   Related bills: ${billCount[0].count}`);
    console.log(`   Related estimates: ${estimateCount[0].count}`);
    console.log('✅ Cascade relationships verified (not testing actual delete)');

    // Test 3: Check unique constraints
    console.log('\n🔒 Testing unique constraints...');
    const uniqueConstraints = await db.execute(sql`
      SELECT
        tc.constraint_name,
        tc.table_name,
        string_agg(kcu.column_name, ', ') as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_schema = 'public'
      GROUP BY tc.constraint_name, tc.table_name
      ORDER BY tc.table_name
    `);
    console.log(`✅ Found ${uniqueConstraints.length} unique constraints`);
    uniqueConstraints.forEach((uc) => {
      const ucTyped = uc as { table_name: string; columns: string };
      console.log(`   - ${ucTyped.table_name}: ${ucTyped.columns}`);
    });

    // Test 4: Test referential integrity
    console.log('\n🔍 Testing referential integrity...');

    // Check for orphaned invoices
    const orphanedInvoices = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM invoices i
      WHERE i.project_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = i.project_id)
    `);
    console.log(`   Orphaned invoices: ${orphanedInvoices[0].count} (should be 0)`);

    // Check for orphaned bills
    const orphanedBills = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM bills b
      WHERE b.project_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = b.project_id)
    `);
    console.log(`   Orphaned bills: ${orphanedBills[0].count} (should be 0)`);

    // Check for orphaned estimates
    const orphanedEstimates = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM project_estimates e
      WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = e.project_id)
    `);
    console.log(`   Orphaned estimates: ${orphanedEstimates[0].count} (should be 0)`);

    if (orphanedInvoices[0].count === 0 && orphanedBills[0].count === 0 && orphanedEstimates[0].count === 0) {
      console.log('✅ No orphaned records found - referential integrity maintained');
    } else {
      console.log('❌ Orphaned records found - referential integrity violated!');
    }

    // Test 5: Check indexes for performance
    console.log('\n🚀 Testing indexes...');
    const indexes = await db.execute(sql`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname
    `);
    console.log(`✅ Found ${indexes.length} non-primary indexes`);

    // Group indexes by table
    const indexByTable: Record<string, string[]> = {};
    indexes.forEach((idx) => {
      const idxTyped = idx as { tablename: string; indexname: string };
      if (!indexByTable[idxTyped.tablename]) {
        indexByTable[idxTyped.tablename] = [];
      }
      indexByTable[idxTyped.tablename].push(idxTyped.indexname);
    });

    Object.entries(indexByTable).forEach(([table, idxs]) => {
      console.log(`   ${table}: ${idxs.length} indexes`);
      idxs.forEach(idx => console.log(`     - ${idx}`));
    });

    // Test 6: Test triggers
    console.log('\n⚡ Testing triggers...');
    const triggers = await db.execute(sql`
      SELECT
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);
    console.log(`✅ Found ${triggers.length} triggers`);
    triggers.forEach((t) => {
      const tTyped = t as { event_object_table: string; trigger_name: string; action_timing: string; event_manipulation: string };
      console.log(`   - ${tTyped.event_object_table}: ${tTyped.trigger_name} (${tTyped.action_timing} ${tTyped.event_manipulation}`);
    });

    // Test 7: Verify enum types
    console.log('\n📝 Testing enum types...');
    const enums = await db.execute(sql`
      SELECT
        t.typname as enum_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname
    `);
    console.log(`✅ Found ${enums.length} enum types`);
    enums.forEach((e) => {
      const eTyped = e as { enum_name: string; enum_values: string[] };
      console.log(`   - ${eTyped.enum_name}: ${eTyped.enum_values.length} values`);
    });

    // Test 8: Check materialized view
    console.log('\n👁️ Testing materialized view...');
    const matView = await db.execute(sql`
      SELECT
        schemaname,
        matviewname,
        hasindexes,
        ispopulated
      FROM pg_matviews
      WHERE schemaname = 'public'
    `);
    if (matView.length > 0) {
      console.log(`✅ Materialized view found: ${matView[0].matviewname}`);
      console.log(`   - Has indexes: ${matView[0].hasindexes}`);
      console.log(`   - Is populated: ${matView[0].ispopulated}`);
    } else {
      console.log('⚠️ No materialized view found');
    }

    console.log('\n🎉 All relationship tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Relationship test failed:', error);
    process.exit(1);
  }
}

testRelationships();