import { db } from './index';
import {
  projects,
  buildPhases,
  invoices,
  bills,
  projectEstimates,
  syncStatus,
  auditLogs,
  userPreferences,
  phaseProgress
} from './schema';
import { sql } from 'drizzle-orm';

// UK construction company names
const companies = [
  'Balfour Beatty Construction', 'Kier Group', 'Morgan Sindall', 'Laing O\'Rourke',
  'Galliford Try', 'BAM Construct UK', 'Willmott Dixon', 'ISG Construction',
  'Wates Group', 'Mace Ltd', 'Skanska UK', 'Vinci Construction UK',
  'Bowmer & Kirkland', 'McLaughlin & Harvey', 'Graham Construction', 'Seddon Construction',
  'Lovell Partnerships', 'Keepmoat Homes', 'Miller Construction', 'Robertson Group',
  'Osborne Construction', 'Buckingham Group', 'VolkerWessels UK', 'Winvic Construction',
  'McLaren Construction', 'Byrne Group', 'Durkan Ltd', 'Ardmore Construction',
  'Geoffrey Osborne Ltd', 'Higgins Construction', 'Bugler Developments', 'Rydon Construction',
  'Thomas Sinden Ltd', 'Rooff Ltd', 'Feltham Construction', 'Borras Construction',
  'Farrans Construction', 'Bennett Construction', 'Speller Metcalfe', 'Bluestone Construction',
  'RG Carter', 'Jehu Group', 'Ashe Construction', 'Barnes Construction',
  'Stepnell Ltd', 'Claritas Group', 'Paragon Building', 'Westridge Construction',
  'Horizon Construction', 'Premier Building Solutions'
];

// UK cities and regions
const locations = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Newcastle', 'Bristol',
  'Sheffield', 'Nottingham', 'Leicester', 'Brighton', 'Southampton', 'Portsmouth',
  'Reading', 'Oxford', 'Cambridge', 'Norwich', 'Ipswich', 'Milton Keynes', 'Luton',
  'Coventry', 'Cardiff', 'Swansea', 'Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee',
  'Belfast', 'Derry', 'York', 'Bath', 'Chester', 'Durham', 'Exeter', 'Gloucester',
  'Kingston upon Hull', 'Stoke-on-Trent', 'Wolverhampton', 'Plymouth', 'Derby',
  'Warwick', 'Worcester', 'Lincoln', 'Canterbury', 'St Albans', 'Chelmsford'
];

// Project types
const projectTypes = [
  'Residential Complex', 'Office Building', 'Shopping Centre', 'Hospital Wing',
  'School Extension', 'University Campus', 'Hotel Development', 'Warehouse Facility',
  'Industrial Park', 'Retail Park', 'Medical Centre', 'Sports Complex',
  'Community Centre', 'Care Home', 'Student Accommodation', 'Apartment Block',
  'Housing Estate', 'Business Park', 'Technology Hub', 'Distribution Centre',
  'Manufacturing Plant', 'Research Facility', 'Conference Centre', 'Theatre Renovation',
  'Museum Extension', 'Library Refurbishment', 'Transport Hub', 'Railway Station',
  'Airport Terminal', 'Marina Development'
];

// Project prefixes for naming
const projectPrefixes = [
  'New', 'Central', 'Royal', 'Victoria', 'Queens', 'Kings', 'St', 'Park',
  'Grand', 'Premier', 'Elite', 'Horizon', 'Summit', 'Gateway', 'Bridge',
  'Riverside', 'Lakeside', 'Hillside', 'Westfield', 'Eastgate', 'Northpoint', 'Southbank'
];

// Project managers
const projectManagers = [
  'John Matthews', 'Sarah Chen', 'Mike Johnson', 'Emma Williams', 'David Brown',
  'Lisa Anderson', 'Tom Wilson', 'Rachel Green', 'Chris Taylor', 'Amy Roberts',
  'James Mitchell', 'Sophie Clarke', 'Daniel Lee', 'Karen White', 'Paul Martin',
  'Helen Davies', 'Mark Thompson', 'Julie Robinson', 'Steve Harris', 'Linda Walker'
];

// Supplier names for bills
const suppliers = [
  'BuildMart Supplies Ltd', 'ProBuild Materials', 'TradePoint Direct', 'Construction Depot',
  'Jewson Ltd', 'Travis Perkins', 'Selco Builders', 'RGB Building Supplies',
  'Buildbase', 'MKM Building Supplies', 'Gibbs & Dandy', 'Covers Timber & Builders',
  'PowerTech Electrical', 'Edmundson Electrical', 'City Electrical Factors', 'Rexel UK',
  'PlumbCenter', 'Wolseley Plumb', 'Screwfix Trade', 'Toolstation Pro',
  'HSS Hire', 'Speedy Hire', 'A-Plant', 'Brandon Hire Station',
  'SIG Roofing', 'Roofing Superstore', 'About Roofing Supplies', 'Burton Roofing',
  'Aggregate Industries', 'Tarmac', 'CEMEX UK', 'Hanson UK',
  'British Steel', 'Severfield', 'Barrett Steel', 'Metal Supplies Ltd',
  'Saint-Gobain Glass', 'Pilkington UK', 'Guardian Glass', 'Kawneer UK'
];

// Helper function to generate random date between two dates
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate random amount
function randomAmount(min: number, max: number): string {
  return (Math.random() * (max - min) + min).toFixed(2);
}

async function seedComprehensive() {
  console.log('🌱 Starting comprehensive database seed...\n');

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

    // Insert build phases
    console.log('📦 Inserting build phases...');
    const phasesData = [
      {
        id: 'BP001',
        xero_phase_id: 'XBP001',
        name: 'Demolition Enabling works',
        description: 'Demolition and site enabling works',
        tracking_category_id: 'TRACK002',
        display_order: 1,
        color: '#8B4513',
        icon: 'Hammer',
        typical_duration_days: 14,
      },
      {
        id: 'BP002',
        xero_phase_id: 'XBP002',
        name: 'Groundworks',
        description: 'Foundation and ground preparation',
        tracking_category_id: 'TRACK002',
        display_order: 2,
        color: '#8B5A2B',
        icon: 'Shovel',
        typical_duration_days: 21,
      },
      {
        id: 'BP003',
        xero_phase_id: 'XBP003',
        name: 'Masonry',
        description: 'Brickwork and blockwork',
        tracking_category_id: 'TRACK002',
        display_order: 3,
        color: '#A0522D',
        icon: 'Layers',
        typical_duration_days: 28,
      },
      {
        id: 'BP004',
        xero_phase_id: 'XBP004',
        name: 'Roofing',
        description: 'Roof structure and covering',
        tracking_category_id: 'TRACK002',
        display_order: 4,
        color: '#708090',
        icon: 'Home',
        typical_duration_days: 14,
      },
      {
        id: 'BP005',
        xero_phase_id: 'XBP005',
        name: 'Electrical',
        description: 'Electrical installation and wiring',
        tracking_category_id: 'TRACK002',
        display_order: 5,
        color: '#FFD700',
        icon: 'Zap',
        typical_duration_days: 21,
      },
      {
        id: 'BP006',
        xero_phase_id: 'XBP006',
        name: 'Plumbing & Heating',
        description: 'Plumbing and heating systems',
        tracking_category_id: 'TRACK002',
        display_order: 6,
        color: '#4682B4',
        icon: 'Droplets',
        typical_duration_days: 21,
      },
      {
        id: 'BP007',
        xero_phase_id: 'XBP007',
        name: 'Joinery',
        description: 'Carpentry and joinery work',
        tracking_category_id: 'TRACK002',
        display_order: 7,
        color: '#8B7355',
        icon: 'Hammer',
        typical_duration_days: 14,
      },
      {
        id: 'BP008',
        xero_phase_id: 'XBP008',
        name: 'Windows and doors',
        description: 'Window and door installation',
        tracking_category_id: 'TRACK002',
        display_order: 8,
        color: '#87CEEB',
        icon: 'DoorOpen',
        typical_duration_days: 7,
      },
      {
        id: 'BP009',
        xero_phase_id: 'XBP009',
        name: 'Drylining & Plaster/Render',
        description: 'Internal walls and plastering',
        tracking_category_id: 'TRACK002',
        display_order: 9,
        color: '#F5F5DC',
        icon: 'PaintRoller',
        typical_duration_days: 14,
      },
      {
        id: 'BP010',
        xero_phase_id: 'XBP010',
        name: 'Decoration',
        description: 'Painting and decorating',
        tracking_category_id: 'TRACK002',
        display_order: 10,
        color: '#9370DB',
        icon: 'Paintbrush',
        typical_duration_days: 14,
      },
      {
        id: 'BP011',
        xero_phase_id: 'XBP011',
        name: 'Landscaping',
        description: 'External landscaping and gardens',
        tracking_category_id: 'TRACK002',
        display_order: 11,
        color: '#228B22',
        icon: 'Trees',
        typical_duration_days: 21,
      },
      {
        id: 'BP012',
        xero_phase_id: 'XBP012',
        name: 'Finishes Schedule',
        description: 'Final finishes and fittings',
        tracking_category_id: 'TRACK002',
        display_order: 12,
        color: '#DAA520',
        icon: 'ListChecks',
        typical_duration_days: 14,
      },
      {
        id: 'BP013',
        xero_phase_id: 'XBP013',
        name: 'Steelwork',
        description: 'Structural steel installation',
        tracking_category_id: 'TRACK002',
        display_order: 13,
        color: '#696969',
        icon: 'HardHat',
        typical_duration_days: 14,
      },
      {
        id: 'BP014',
        xero_phase_id: 'XBP014',
        name: 'Flooring/Tiling',
        description: 'Floor coverings and tiling',
        tracking_category_id: 'TRACK002',
        display_order: 14,
        color: '#D2691E',
        icon: 'Grid3x3',
        typical_duration_days: 14,
      },
      {
        id: 'BP015',
        xero_phase_id: 'XBP015',
        name: 'Kitchen',
        description: 'Kitchen installation and fitting',
        tracking_category_id: 'TRACK002',
        display_order: 15,
        color: '#FF6347',
        icon: 'ChefHat',
        typical_duration_days: 7,
      },
      {
        id: 'BP016',
        xero_phase_id: 'XBP016',
        name: 'Extra',
        description: 'Additional works and variations',
        tracking_category_id: 'TRACK002',
        display_order: 16,
        color: '#6B7280',
        icon: 'Plus',
        typical_duration_days: 7,
      },
      {
        id: 'BP017',
        xero_phase_id: 'XBP017',
        name: 'Project Management Fee',
        description: 'Project management and administration',
        tracking_category_id: 'TRACK002',
        display_order: 17,
        color: '#4B0082',
        icon: 'Briefcase',
        typical_duration_days: 0,
      },
    ];
    await db.insert(buildPhases).values(phasesData);
    console.log(`✅ Inserted ${phasesData.length} build phases\n`);

    // Generate 50+ projects
    console.log('🏗️ Generating projects...');
    const projectsData = [];
    const numProjects = 55; // Generate 55 projects

    for (let i = 0; i < numProjects; i++) {
      const status = Math.random() > 0.3 ? 'active' : 'completed';
      const startDate = randomDate(new Date('2023-01-01'), new Date('2024-06-01'));
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + Math.floor(Math.random() * 18) + 3);

      // Generate project name
      const prefix = projectPrefixes[Math.floor(Math.random() * projectPrefixes.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const type = projectTypes[Math.floor(Math.random() * projectTypes.length)];
      const projectName = `${prefix} ${location} ${type}`;

      projectsData.push({
        id: `PROJ${String(i + 1).padStart(3, '0')}`,
        xero_project_id: `XPROJ${String(i + 1).padStart(3, '0')}`,
        name: projectName,
        client_name: companies[i % companies.length],
        client_contact_id: `CONT${String(i + 1).padStart(3, '0')}`,
        tracking_category_id: 'TRACK001',
        status: status,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        project_manager: projectManagers[i % projectManagers.length],
        is_active: status === 'active',
        metadata: {
          location: location,
          type: type.split(' ')[0].toLowerCase(),
          size: ['small', 'medium', 'large', 'enterprise'][Math.floor(Math.random() * 4)]
        },
      });
    }
    await db.insert(projects).values(projectsData);
    console.log(`✅ Inserted ${projectsData.length} projects\n`);

    // Generate invoices (200+)
    console.log('💰 Generating invoices...');
    const invoicesData = [];
    let invoiceCounter = 1;

    for (const project of projectsData) {
      // Each project gets 3-5 invoices
      const numInvoices = Math.floor(Math.random() * 3) + 3;

      // Determine how far the project has progressed (which phases are active)
      // Projects typically progress through phases sequentially
      const maxPhaseIndex = Math.min(
        Math.floor(Math.random() * 8) + 2, // Projects are in phases 2-9 typically
        phasesData.length - 1
      );

      for (let j = 0; j < numInvoices; j++) {
        // Assign invoices to phases that make sense for project progress
        // Earlier invoices go to earlier phases
        const phaseIndex = Math.min(
          Math.floor(j * maxPhaseIndex / numInvoices),
          maxPhaseIndex
        );
        const phase = phasesData[phaseIndex];
        const invoiceDate = randomDate(
          new Date(project.start_date),
          new Date(project.end_date)
        );
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);

        // Determine invoice status
        const statusRoll = Math.random();
        const status = statusRoll > 0.7 ? 'PAID' : statusRoll > 0.4 ? 'AUTHORISED' : 'DRAFT';

        // Generate amounts based on project size
        const baseAmount = project.metadata.size === 'enterprise' ? 500000 :
                          project.metadata.size === 'large' ? 200000 :
                          project.metadata.size === 'medium' ? 50000 : 10000;

        const subTotal = randomAmount(baseAmount * 0.5, baseAmount * 1.5);
        const taxAmount = (parseFloat(subTotal) * 0.2).toFixed(2);
        const total = (parseFloat(subTotal) + parseFloat(taxAmount)).toFixed(2);
        const amountPaid = status === 'PAID' ? total :
                          status === 'AUTHORISED' ? randomAmount(0, parseFloat(total)) : '0.00';
        const amountDue = (parseFloat(total) - parseFloat(amountPaid)).toFixed(2);

        invoicesData.push({
          id: `INV${String(invoiceCounter).padStart(3, '0')}`,
          xero_invoice_id: `XINV${String(invoiceCounter).padStart(3, '0')}`,
          invoice_number: `INV-2024-${String(invoiceCounter).padStart(4, '0')}`,
          reference: `${project.name} - ${phase.name}`,
          contact_id: project.client_contact_id,
          contact_name: project.client_name,
          project_id: project.id,
          build_phase_id: phase.id,
          type: 'ACCREC' as const,
          status: status as 'DRAFT' | 'AUTHORISED' | 'PAID' | 'VOIDED',
          line_amount_types: 'Exclusive',
          sub_total: subTotal,
          total_tax: taxAmount,
          total: total,
          amount_paid: amountPaid,
          amount_due: amountDue,
          currency_code: 'GBP',
          invoice_date: invoiceDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          fully_paid_date: status === 'PAID' ? dueDate.toISOString().split('T')[0] : null,
          line_items: [],
          payments: [],
          credit_notes: [],
          attachments: [],
          xero_data: {},
        });

        invoiceCounter++;
      }
    }
    await db.insert(invoices).values(invoicesData);
    console.log(`✅ Inserted ${invoicesData.length} invoices\n`);

    // Generate bills (150+)
    console.log('📄 Generating bills...');
    const billsData = [];
    let billCounter = 1;

    for (const project of projectsData) {
      // Each project gets 2-4 bills
      const numBills = Math.floor(Math.random() * 3) + 2;

      // Use similar phase progression as invoices
      const maxPhaseIndex = Math.min(
        Math.floor(Math.random() * 8) + 2,
        phasesData.length - 1
      );

      for (let j = 0; j < numBills; j++) {
        // Bills also follow sequential phase progression
        const phaseIndex = Math.min(
          Math.floor(j * maxPhaseIndex / numBills),
          maxPhaseIndex
        );
        const phase = phasesData[phaseIndex];
        const billDate = randomDate(
          new Date(project.start_date),
          new Date(project.end_date)
        );
        const dueDate = new Date(billDate);
        dueDate.setDate(dueDate.getDate() + 30);

        // Determine bill status
        const statusRoll = Math.random();
        const status = statusRoll > 0.6 ? 'PAID' : statusRoll > 0.3 ? 'AUTHORISED' : 'DRAFT';

        // Generate amounts (bills are typically 40-60% of invoice amounts)
        const baseAmount = project.metadata.size === 'enterprise' ? 200000 :
                          project.metadata.size === 'large' ? 80000 :
                          project.metadata.size === 'medium' ? 20000 : 5000;

        const subTotal = randomAmount(baseAmount * 0.5, baseAmount * 1.5);
        const taxAmount = (parseFloat(subTotal) * 0.2).toFixed(2);
        const total = (parseFloat(subTotal) + parseFloat(taxAmount)).toFixed(2);
        const amountPaid = status === 'PAID' ? total : '0.00';
        const amountDue = (parseFloat(total) - parseFloat(amountPaid)).toFixed(2);

        billsData.push({
          id: `BILL${String(billCounter).padStart(3, '0')}`,
          xero_bill_id: `XBILL${String(billCounter).padStart(3, '0')}`,
          bill_number: `BILL-2024-${String(billCounter).padStart(4, '0')}`,
          reference: `${phase.name} - ${project.name}`,
          contact_id: `SUPP${String((billCounter % 40) + 1).padStart(3, '0')}`,
          contact_name: suppliers[billCounter % suppliers.length],
          project_id: project.id,
          build_phase_id: phase.id,
          type: 'BILL' as const,
          status: status as 'DRAFT' | 'AUTHORISED' | 'PAID' | 'VOIDED',
          sub_total: subTotal,
          total_tax: taxAmount,
          total: total,
          amount_paid: amountPaid,
          amount_due: amountDue,
          currency_code: 'GBP',
          bill_date: billDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          fully_paid_date: status === 'PAID' ? dueDate.toISOString().split('T')[0] : null,
          line_items: [],
          payments: [],
          attachments: [],
          xero_data: {},
        });

        billCounter++;
      }
    }
    await db.insert(bills).values(billsData);
    console.log(`✅ Inserted ${billsData.length} bills\n`);

    // Generate project estimates for active projects
    console.log('📊 Generating project estimates...');
    const estimatesData = [];

    for (const project of projectsData.filter(p => p.status === 'active')) {
      // Add 1-2 estimates per active project
      const phase = phasesData[Math.floor(Math.random() * phasesData.length)];

      estimatesData.push({
        project_id: project.id,
        build_phase_id: phase.id,
        estimate_type: 'revenue' as const,
        amount: randomAmount(100000, 500000),
        currency: 'GBP',
        notes: `Revenue estimate for ${phase.name}`,
        created_by: project.project_manager.toLowerCase().replace(' ', '.') + '@company.com',
        updated_by: project.project_manager.toLowerCase().replace(' ', '.') + '@company.com',
        version: 1,
      });

      estimatesData.push({
        project_id: project.id,
        build_phase_id: phase.id,
        estimate_type: 'cost' as const,
        amount: randomAmount(50000, 300000),
        currency: 'GBP',
        notes: `Cost estimate for ${phase.name}`,
        created_by: project.project_manager.toLowerCase().replace(' ', '.') + '@company.com',
        updated_by: project.project_manager.toLowerCase().replace(' ', '.') + '@company.com',
        version: 1,
      });
    }
    await db.insert(projectEstimates).values(estimatesData);
    console.log(`✅ Inserted ${estimatesData.length} project estimates\n`);

    // Insert sync status record
    console.log('🔄 Inserting sync status...');
    const syncData = {
      sync_type: 'full_sync',
      status: 'COMPLETED' as const,
      started_at: new Date(),
      completed_at: new Date(),
      records_processed: invoicesData.length + billsData.length,
      records_created: invoicesData.length + billsData.length,
      records_updated: 0,
      records_failed: 0,
      triggered_by: 'seed_script',
    };
    await db.insert(syncStatus).values(syncData);
    console.log('✅ Inserted sync status record\n');

    // Insert sample audit logs
    console.log('📝 Inserting audit logs...');
    const auditData = [];
    for (let i = 0; i < 10; i++) {
      auditData.push({
        event_type: 'data_import',
        event_action: 'create',
        entity_id: projectsData[i].id,
        user_id: 'seed_script',
        user_email: 'system@milestone.com',
        metadata: { source: 'comprehensive_seed' },
      });
    }
    await db.insert(auditLogs).values(auditData);
    console.log(`✅ Inserted ${auditData.length} audit logs\n`);

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
      favorite_projects: projectsData.slice(0, 5).map(p => p.id),
    };
    await db.insert(userPreferences).values(preferencesData);
    console.log('✅ Inserted user preferences\n');

    // Generate phase progress data based on actual work
    console.log('📊 Generating phase progress data...');
    const phaseProgressData = [];

    // Get unique project-phase combinations that have work
    const projectPhaseWork = new Map();

    // Track phases with invoices
    for (const invoice of invoicesData) {
      const key = `${invoice.project_id}-${invoice.build_phase_id}`;
      if (!projectPhaseWork.has(key)) {
        projectPhaseWork.set(key, {
          project_id: invoice.project_id,
          build_phase_id: invoice.build_phase_id,
          hasInvoice: true,
          hasBill: false
        });
      } else {
        projectPhaseWork.get(key).hasInvoice = true;
      }
    }

    // Track phases with bills
    for (const bill of billsData) {
      const key = `${bill.project_id}-${bill.build_phase_id}`;
      if (!projectPhaseWork.has(key)) {
        projectPhaseWork.set(key, {
          project_id: bill.project_id,
          build_phase_id: bill.build_phase_id,
          hasInvoice: false,
          hasBill: true
        });
      } else {
        projectPhaseWork.get(key).hasBill = true;
      }
    }

    // Generate progress for phases with work
    for (const work of projectPhaseWork.values()) {
      // Determine progress based on what work exists
      let progress = 0;
      if (work.hasInvoice && work.hasBill) {
        progress = Math.floor(Math.random() * 30) + 70; // 70-100% if both invoice and bill
      } else if (work.hasInvoice) {
        progress = Math.floor(Math.random() * 30) + 40; // 40-70% if only invoice
      } else if (work.hasBill) {
        progress = Math.floor(Math.random() * 30) + 10; // 10-40% if only bill
      }

      phaseProgressData.push({
        project_id: work.project_id,
        build_phase_id: work.build_phase_id,
        progress_percentage: progress,
        last_updated_by: 'comprehensive_seed'
      });
    }

    // Insert phase progress data
    for (const progress of phaseProgressData) {
      await db.insert(phaseProgress).values(progress);
    }
    console.log(`✅ Inserted ${phaseProgressData.length} phase progress records\n`);

    // Refresh materialized view
    console.log('🔄 Refreshing materialized view...');
    await db.execute(sql`REFRESH MATERIALIZED VIEW milestone.project_phase_summary`);
    console.log('✅ Materialized view refreshed\n');

    // Calculate statistics
    const totalRevenue = invoicesData.reduce((sum, inv) => sum + parseFloat(inv.sub_total), 0);
    const totalCosts = billsData.reduce((sum, bill) => sum + parseFloat(bill.sub_total), 0);
    const profit = totalRevenue - totalCosts;
    const profitMargin = (profit / totalRevenue) * 100;

    console.log('🎉 Comprehensive database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${phasesData.length} build phases`);
    console.log(`   - ${projectsData.length} projects`);
    console.log(`   - ${invoicesData.length} invoices (Total: £${totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })})`);
    console.log(`   - ${billsData.length} bills (Total: £${totalCosts.toLocaleString('en-GB', { minimumFractionDigits: 2 })})`);
    console.log(`   - ${estimatesData.length} project estimates`);
    console.log(`   - Profit: £${profit.toLocaleString('en-GB', { minimumFractionDigits: 2 })} (${profitMargin.toFixed(1)}%)`);
    console.log(`   - ${auditData.length} audit log entries`);
    console.log(`   - 1 sync status record`);
    console.log(`   - 1 user preference record`);

    console.log('\n📈 Project Distribution:');
    console.log(`   - Active: ${projectsData.filter(p => p.status === 'active').length}`);
    console.log(`   - Completed: ${projectsData.filter(p => p.status === 'completed').length}`);
    console.log(`   - Small: ${projectsData.filter(p => p.metadata.size === 'small').length}`);
    console.log(`   - Medium: ${projectsData.filter(p => p.metadata.size === 'medium').length}`);
    console.log(`   - Large: ${projectsData.filter(p => p.metadata.size === 'large').length}`);
    console.log(`   - Enterprise: ${projectsData.filter(p => p.metadata.size === 'enterprise').length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedComprehensive();