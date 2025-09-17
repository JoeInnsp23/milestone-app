import {
  getDashboardStats,
  getProjectSummaries,
  getProjects,
  getProjectById,
  getInvoicesByProject,
  getPendingInvoices,
  getOverdueInvoices,
  getBillsByProject,
  getUnpaidBills,
  getUserPreferences,
  getBuildPhases,
  getLastSyncStatus,
  getSyncHistory,
  createEstimate,
  updateEstimate,
  deleteEstimate,
  createAuditLog,
  createExportRecord,
} from '../src/lib/queries';

async function testQueries() {
  console.log('🧪 Testing all database queries...\n');

  try {
    // Test 1: Dashboard Stats
    console.log('📊 Testing getDashboardStats...');
    const stats = await getDashboardStats() as unknown as { total_revenue: string; total_costs: string; total_profit: string; profit_margin: string }; // Type inference issue with raw SQL
    console.log('✅ Dashboard stats:', {
      revenue: stats.total_revenue,
      costs: stats.total_costs,
      profit: stats.total_profit,
      margin: stats.profit_margin,
    });

    // Test 2: Project Summaries
    console.log('\n📋 Testing getProjectSummaries...');
    const summaries = await getProjectSummaries();
    console.log(`✅ Found ${summaries.length} project phase summaries`);

    // Test 3: Get Projects
    console.log('\n🏗️ Testing getProjects...');
    const projects = await getProjects({ isActive: true });
    console.log(`✅ Found ${projects.length} active projects`);

    // Test 4: Get Project by ID
    if (projects.length > 0) {
      console.log('\n🔍 Testing getProjectById...');
      const project = await getProjectById(projects[0].id);
      console.log(`✅ Retrieved project: ${project?.name}`);
      console.log(`   - Invoices: ${project?.invoices.length}`);
      console.log(`   - Bills: ${project?.bills.length}`);
      console.log(`   - Estimates: ${project?.estimates.length}`);

      // Test 5: Get Invoices by Project
      console.log('\n💰 Testing getInvoicesByProject...');
      const invoices = await getInvoicesByProject(projects[0].id);
      console.log(`✅ Found ${invoices.length} invoices`);

      // Test 6: Get Bills by Project
      console.log('\n📄 Testing getBillsByProject...');
      const bills = await getBillsByProject(projects[0].id);
      console.log(`✅ Found ${bills.length} bills`);
    }

    // Test 7: Get Pending Invoices
    console.log('\n⏳ Testing getPendingInvoices...');
    const pendingInvoices = await getPendingInvoices();
    console.log(`✅ Found ${pendingInvoices.length} pending invoices`);

    // Test 8: Get Overdue Invoices
    console.log('\n⚠️ Testing getOverdueInvoices...');
    const overdueInvoices = await getOverdueInvoices();
    console.log(`✅ Found ${overdueInvoices.length} overdue invoices`);

    // Test 9: Get Unpaid Bills
    console.log('\n💸 Testing getUnpaidBills...');
    const unpaidBills = await getUnpaidBills();
    console.log(`✅ Found ${unpaidBills.length} unpaid bills`);

    // Test 10: Get Build Phases
    console.log('\n🏗️ Testing getBuildPhases...');
    const phases = await getBuildPhases();
    console.log(`✅ Found ${phases.length} build phases`);
    phases.forEach(p => console.log(`   - ${p.name} (Order: ${p.display_order})`));

    // Test 11: User Preferences
    console.log('\n⚙️ Testing getUserPreferences...');
    const testUserId = 'test_user_001';
    const prefs = await getUserPreferences(testUserId);
    console.log(`✅ User preferences: Theme=${prefs.theme}, Currency=${prefs.currency}`);

    // Test 12: Sync Status
    console.log('\n🔄 Testing getLastSyncStatus...');
    const lastSync = await getLastSyncStatus();
    console.log(`✅ Last sync: ${lastSync?.status} at ${lastSync?.completed_at}`);

    // Test 13: Sync History
    console.log('\n📜 Testing getSyncHistory...');
    const syncHistory = await getSyncHistory(5);
    console.log(`✅ Found ${syncHistory.length} sync records`);

    // Test 14: Estimate CRUD
    if (projects.length > 0) {
      console.log('\n📊 Testing estimate CRUD operations...');

      try {
        // Create estimate (use a unique type to avoid conflicts)
        const newEstimate = await createEstimate({
          project_id: projects[0].id,
          build_phase_id: phases[0]?.id,
          estimate_type: 'hours',  // Use 'hours' type to avoid conflict with existing revenue estimates
          amount: '500.00',
          currency: 'GBP',
          notes: 'Test estimate from query test',
          created_by: testUserId,
          updated_by: testUserId,
        });
        console.log(`✅ Created estimate: ${newEstimate.id}`);

        // Update estimate
        const updated = await updateEstimate(
          newEstimate.id,
          { amount: '550.00', notes: 'Updated test estimate' },
          testUserId
        );
        console.log(`✅ Updated estimate amount to: ${updated.amount}`);

        // Soft delete estimate
        const deleted = await deleteEstimate(newEstimate.id, testUserId);
        console.log(`✅ Soft deleted estimate: valid_until=${deleted.valid_until}`);
      } catch (e) {
        if ((e as { code?: string }).code === '23505') {
          console.log('⚠️ Estimate already exists (expected behavior with unique constraint)');
        } else {
          throw e;
        }
      }
    }

    // Test 15: Audit Log
    console.log('\n📝 Testing createAuditLog...');
    const auditLog = await createAuditLog({
      event_type: 'test_event',
      event_action: 'test',
      entity_id: 'test_entity',
      user_id: testUserId,
      user_email: 'test@example.com',
      metadata: { test: true },
    });
    console.log(`✅ Created audit log: ${auditLog.id}`);

    // Test 16: Export Record
    console.log('\n📤 Testing createExportRecord...');
    const exportRecord = await createExportRecord({
      export_type: 'CSV',
      export_scope: 'test',
      filters_applied: { test: true },
      file_name: 'test.csv',
      file_size_bytes: 1024,
      rows_exported: 10,
      user_id: testUserId,
      user_email: 'test@example.com',
    });
    console.log(`✅ Created export record: ${exportRecord.id}`);

    console.log('\n🎉 All query tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Query test failed:', error);
    process.exit(1);
  }
}

testQueries();