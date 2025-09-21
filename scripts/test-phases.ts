import { db } from '../src/db';
import { buildPhases } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function testPhases() {
  try {
    console.log('Testing getAllPhases functionality...\n');

    const phases = await db.select({
      id: buildPhases.id,
      name: buildPhases.name,
      color: buildPhases.color,
      icon: buildPhases.icon,
      display_order: buildPhases.display_order
    })
    .from(buildPhases)
    .where(eq(buildPhases.is_active, true))
    .orderBy(buildPhases.display_order);

    console.log(`✅ Found ${phases.length} phases:\n`);
    phases.forEach(phase => {
      console.log(`  ${phase.id}: ${phase.name}`);
    });

    if (phases.length === 17) {
      console.log('\n✅ SUCCESS: All 17 phases are present in the database!');
    } else {
      console.log(`\n❌ ERROR: Expected 17 phases but found ${phases.length}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPhases();