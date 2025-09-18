import { db } from './index';
import {
  projects,
  buildPhases,
  invoices,
  bills,
  projectEstimates,
  syncStatus,
  auditLogs,
  userPreferences
} from './schema';
import { sql } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await db.execute(sql`TRUNCATE TABLE milestone.audit_logs CASCADE`);
    await db.execute(sql`TRUNCATE TABLE milestone.export_history CASCADE`);
    await db.execute(sql`TRUNCATE TABLE milestone.user_preferences CASCADE`);
    await db.execute(sql`TRUNCATE TABLE milestone.project_estimates CASCADE`);
    await db.execute(sql`TRUNCATE TABLE milestone.bills CASCADE`);
    await db.execute(sql`TRUNCATE TABLE milestone.invoices CASCADE`);
    await db.execute(sql`TRUNCATE TABLE milestone.projects CASCADE`);
    await db.execute(sql`TRUNCATE TABLE milestone.build_phases CASCADE`);
    await db.execute(sql`TRUNCATE TABLE milestone.sync_status CASCADE`);
    console.log('✅ Existing data cleared\n');

    // Insert build phases (Xero tracking categories)
    console.log('📦 Inserting build phases...');
    const phasesData = [
      {
        id: 'BP001',
        xero_phase_id: 'XBP001',
        name: 'Planning & Design',
        description: 'Initial planning, architectural design, and permits',
        tracking_category_id: 'TRACK002',
        display_order: 1,
        color: '#3B82F6',
        icon: 'blueprint',
        typical_duration_days: 30,
      },
      {
        id: 'BP002',
        xero_phase_id: 'XBP002',
        name: 'Foundation',
        description: 'Site preparation and foundation work',
        tracking_category_id: 'TRACK002',
        display_order: 2,
        color: '#8B5CF6',
        icon: 'foundation',
        typical_duration_days: 21,
      },
      {
        id: 'BP003',
        xero_phase_id: 'XBP003',
        name: 'Framing',
        description: 'Structural framing and roofing',
        tracking_category_id: 'TRACK002',
        display_order: 3,
        color: '#10B981',
        icon: 'frame',
        typical_duration_days: 28,
      },
      {
        id: 'BP004',
        xero_phase_id: 'XBP004',
        name: 'MEP Installation',
        description: 'Mechanical, electrical, and plumbing',
        tracking_category_id: 'TRACK002',
        display_order: 4,
        color: '#F59E0B',
        icon: 'electrical',
        typical_duration_days: 21,
      },
      {
        id: 'BP005',
        xero_phase_id: 'XBP005',
        name: 'Interior Finishes',
        description: 'Drywall, flooring, painting, and fixtures',
        tracking_category_id: 'TRACK002',
        display_order: 5,
        color: '#EF4444',
        icon: 'paint',
        typical_duration_days: 35,
      },
    ];
    await db.insert(buildPhases).values(phasesData);
    console.log(`✅ Inserted ${phasesData.length} build phases\n`);

    // Insert projects (from Xero)
    console.log('🏗️ Inserting projects...');
    const projectsData = [
      {
        id: 'PROJ001',
        xero_project_id: 'XPROJ001',
        name: 'Green Valley Residential Complex',
        client_name: 'Smith Development Ltd',
        client_contact_id: 'CONT001',
        tracking_category_id: 'TRACK001',
        status: 'active',
        start_date: '2024-01-15',
        end_date: '2024-12-31',
        project_manager: 'John Matthews',
        is_active: true,
        metadata: { location: 'Surrey', units: 24 },
      },
      {
        id: 'PROJ002',
        xero_project_id: 'XPROJ002',
        name: 'Oak Street Office Building',
        client_name: 'Corporate Holdings Inc',
        client_contact_id: 'CONT002',
        tracking_category_id: 'TRACK001',
        status: 'active',
        start_date: '2024-03-01',
        end_date: '2025-02-28',
        project_manager: 'Sarah Chen',
        is_active: true,
        metadata: { location: 'London', floors: 5 },
      },
      {
        id: 'PROJ003',
        xero_project_id: 'XPROJ003',
        name: 'Riverside Apartments Renovation',
        client_name: 'Property Management Group',
        client_contact_id: 'CONT003',
        tracking_category_id: 'TRACK001',
        status: 'completed',
        start_date: '2023-06-01',
        end_date: '2024-02-29',
        project_manager: 'Mike Johnson',
        is_active: false,
        metadata: { location: 'Birmingham', type: 'renovation' },
      },
    ];
    await db.insert(projects).values(projectsData);
    console.log(`✅ Inserted ${projectsData.length} projects\n`);

    // Insert invoices (from Xero)
    console.log('💰 Inserting invoices...');
    const invoicesData = [
      {
        id: 'INV001',
        xero_invoice_id: 'XINV001',
        invoice_number: 'INV-2024-001',
        reference: 'Green Valley - Planning Phase',
        contact_id: 'CONT001',
        contact_name: 'Smith Development Ltd',
        project_id: 'PROJ001',
        build_phase_id: 'BP001',
        type: 'ACCREC' as const,
        status: 'PAID' as const,
        line_amount_types: 'Exclusive',
        sub_total: '45000.00',
        total_tax: '9000.00',
        total: '54000.00',
        amount_paid: '54000.00',
        amount_due: '0.00',
        currency_code: 'GBP',
        invoice_date: '2024-02-01',
        due_date: '2024-03-01',
        fully_paid_date: '2024-02-15',
        line_items: [],
        payments: [],
        credit_notes: [],
        attachments: [],
        xero_data: {},
      },
      {
        id: 'INV002',
        xero_invoice_id: 'XINV002',
        invoice_number: 'INV-2024-002',
        reference: 'Green Valley - Foundation',
        contact_id: 'CONT001',
        contact_name: 'Smith Development Ltd',
        project_id: 'PROJ001',
        build_phase_id: 'BP002',
        type: 'ACCREC' as const,
        status: 'AUTHORISED' as const,
        line_amount_types: 'Exclusive',
        sub_total: '120000.00',
        total_tax: '24000.00',
        total: '144000.00',
        amount_paid: '72000.00',
        amount_due: '72000.00',
        currency_code: 'GBP',
        invoice_date: '2024-03-15',
        due_date: '2024-04-15',
        line_items: [],
        payments: [],
        credit_notes: [],
        attachments: [],
        xero_data: {},
      },
      {
        id: 'INV003',
        xero_invoice_id: 'XINV003',
        invoice_number: 'INV-2024-003',
        reference: 'Oak Street - Design Phase',
        contact_id: 'CONT002',
        contact_name: 'Corporate Holdings Inc',
        project_id: 'PROJ002',
        build_phase_id: 'BP001',
        type: 'ACCREC' as const,
        status: 'AUTHORISED' as const,
        line_amount_types: 'Exclusive',
        sub_total: '85000.00',
        total_tax: '17000.00',
        total: '102000.00',
        amount_paid: '0.00',
        amount_due: '102000.00',
        currency_code: 'GBP',
        invoice_date: '2024-04-01',
        due_date: '2024-05-01',
        line_items: [],
        payments: [],
        credit_notes: [],
        attachments: [],
        xero_data: {},
      },
    ];
    await db.insert(invoices).values(invoicesData);
    console.log(`✅ Inserted ${invoicesData.length} invoices\n`);

    // Insert bills (from Xero)
    console.log('📄 Inserting bills...');
    const billsData = [
      {
        id: 'BILL001',
        xero_bill_id: 'XBILL001',
        bill_number: 'SUP-2024-101',
        reference: 'Concrete Supply - Foundation',
        contact_id: 'SUPP001',
        contact_name: 'BuildMart Supplies Ltd',
        project_id: 'PROJ001',
        build_phase_id: 'BP002',
        type: 'BILL' as const,
        status: 'PAID' as const,
        sub_total: '35000.00',
        total_tax: '7000.00',
        total: '42000.00',
        amount_paid: '42000.00',
        amount_due: '0.00',
        currency_code: 'GBP',
        bill_date: '2024-03-10',
        due_date: '2024-04-10',
        fully_paid_date: '2024-03-25',
        line_items: [],
        payments: [],
        attachments: [],
        xero_data: {},
      },
      {
        id: 'BILL002',
        xero_bill_id: 'XBILL002',
        bill_number: 'CONT-2024-055',
        reference: 'Electrical Contractor',
        contact_id: 'SUPP002',
        contact_name: 'PowerTech Electrical',
        project_id: 'PROJ001',
        build_phase_id: 'BP004',
        type: 'BILL' as const,
        status: 'AUTHORISED' as const,
        sub_total: '28000.00',
        total_tax: '5600.00',
        total: '33600.00',
        amount_paid: '0.00',
        amount_due: '33600.00',
        currency_code: 'GBP',
        bill_date: '2024-04-05',
        due_date: '2024-05-05',
        line_items: [],
        payments: [],
        attachments: [],
        xero_data: {},
      },
      {
        id: 'BILL003',
        xero_bill_id: 'XBILL003',
        bill_number: 'ARCH-2024-012',
        reference: 'Architectural Services',
        contact_id: 'SUPP003',
        contact_name: 'Modern Design Studio',
        project_id: 'PROJ002',
        build_phase_id: 'BP001',
        type: 'BILL' as const,
        status: 'PAID' as const,
        sub_total: '22000.00',
        total_tax: '4400.00',
        total: '26400.00',
        amount_paid: '26400.00',
        amount_due: '0.00',
        currency_code: 'GBP',
        bill_date: '2024-03-20',
        due_date: '2024-04-20',
        fully_paid_date: '2024-04-15',
        line_items: [],
        payments: [],
        attachments: [],
        xero_data: {},
      },
    ];
    await db.insert(bills).values(billsData);
    console.log(`✅ Inserted ${billsData.length} bills\n`);

    // Insert project estimates (user-generated)
    console.log('📊 Inserting project estimates...');
    const estimatesData = [
      {
        project_id: 'PROJ001',
        build_phase_id: 'BP003',
        estimate_type: 'revenue' as const,
        amount: '180000.00',
        currency: 'GBP',
        notes: 'Framing phase revenue estimate based on contract',
        created_by: 'john.matthews@company.com',
        updated_by: 'john.matthews@company.com',
        version: 1,
      },
      {
        project_id: 'PROJ001',
        build_phase_id: 'BP003',
        estimate_type: 'cost' as const,
        amount: '95000.00',
        currency: 'GBP',
        notes: 'Estimated costs for materials and labor',
        created_by: 'john.matthews@company.com',
        updated_by: 'john.matthews@company.com',
        version: 1,
      },
      {
        project_id: 'PROJ002',
        build_phase_id: 'BP001',
        estimate_type: 'revenue' as const,
        amount: '125000.00',
        currency: 'GBP',
        notes: 'Design phase billing estimate',
        created_by: 'sarah.chen@company.com',
        updated_by: 'sarah.chen@company.com',
        version: 1,
      },
    ];
    await db.insert(projectEstimates).values(estimatesData);
    console.log(`✅ Inserted ${estimatesData.length} project estimates\n`);

    // Insert sync status record
    console.log('🔄 Inserting sync status...');
    const syncData = {
      sync_type: 'full_sync',
      status: 'COMPLETED' as const,
      started_at: new Date('2024-04-15T10:00:00Z'),
      completed_at: new Date('2024-04-15T10:02:35Z'),
      records_processed: 15,
      records_created: 12,
      records_updated: 3,
      records_failed: 0,
      triggered_by: 'manual',
    };
    await db.insert(syncStatus).values(syncData);
    console.log('✅ Inserted sync status record\n');

    // Insert sample audit log
    console.log('📝 Inserting audit logs...');
    const auditData = [
      {
        event_type: 'estimate_change',
        event_action: 'create',
        entity_id: estimatesData[0].project_id,
        user_id: 'user_2abc123',
        user_email: 'john.matthews@company.com',
        metadata: { estimate_type: 'revenue', amount: 180000 },
      },
    ];
    await db.insert(auditLogs).values(auditData);
    console.log('✅ Inserted audit log\n');

    // Insert user preferences
    console.log('⚙️ Inserting user preferences...');
    const preferencesData = {
      user_id: 'user_2abc123',
      default_view: 'dashboard',
      theme: 'light',
      date_format: 'DD/MM/YYYY',
      currency: 'GBP',
      notifications: { email: true, in_app: true },
      dashboard_layout: {
        widgets: ['revenue_chart', 'project_list', 'alerts'],
        collapsed: []
      },
      saved_filters: [],
      favorite_projects: ['PROJ001'],
    };
    await db.insert(userPreferences).values(preferencesData);
    console.log('✅ Inserted user preferences\n');

    // Refresh materialized view
    console.log('🔄 Refreshing materialized view...');
    await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY milestone.project_phase_summary`);
    console.log('✅ Materialized view refreshed\n');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${phasesData.length} build phases`);
    console.log(`   - ${projectsData.length} projects`);
    console.log(`   - ${invoicesData.length} invoices`);
    console.log(`   - ${billsData.length} bills`);
    console.log(`   - ${estimatesData.length} project estimates`);
    console.log(`   - 1 sync status record`);
    console.log(`   - 1 audit log entry`);
    console.log(`   - 1 user preference record`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();