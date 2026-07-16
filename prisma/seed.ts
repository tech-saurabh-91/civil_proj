// @ts-nocheck
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('Seeding database...')

  // 1. Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@buildsurvey.com' },
    update: {},
    create: {
      email: 'admin@buildsurvey.com',
      password: '$2b$10$hashedpassword', // In production, hash with bcrypt
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+91 98765 43210',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })
  console.log('Admin user created:', adminUser.email)

  // 2. Create Manager User
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@buildsurvey.com' },
    update: {},
    create: {
      email: 'manager@buildsurvey.com',
      password: '$2b$10$hashedpassword',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+91 98765 43211',
      role: 'MANAGER',
      isActive: true,
    },
  })
  console.log('Manager user created:', managerUser.email)

  // 3. Create Engineer Users
  const engineers = [
    { email: 'priya.sharma@buildsurvey.com', firstName: 'Priya', lastName: 'Sharma', phone: '+91 98765 43212' },
    { email: 'amit.patel@buildsurvey.com', firstName: 'Amit', lastName: 'Patel', phone: '+91 98765 43213' },
    { email: 'sneha.reddy@buildsurvey.com', firstName: 'Sneha', lastName: 'Reddy', phone: '+91 98765 43214' },
    { email: 'vikram.singh@buildsurvey.com', firstName: 'Vikram', lastName: 'Singh', phone: '+91 98765 43215' },
  ]

  for (const eng of engineers) {
    await prisma.user.upsert({
      where: { email: eng.email },
      update: {},
      create: {
        ...eng,
        password: '$2b$10$hashedpassword',
        role: 'ENGINEER',
        isActive: true,
      },
    })
  }
  console.log('Engineer users created')

  // 4. Create Surveyor Users
  const surveyors = [
    { email: 'rahul.verma@buildsurvey.com', firstName: 'Rahul', lastName: 'Verma', phone: '+91 98765 43216' },
    { email: 'anjali.nair@buildsurvey.com', firstName: 'Anjali', lastName: 'Nair', phone: '+91 98765 43217' },
  ]

  for (const sur of surveyors) {
    await prisma.user.upsert({
      where: { email: sur.email },
      update: {},
      create: {
        ...sur,
        password: '$2b$10$hashedpassword',
        role: 'SURVEYOR',
        isActive: true,
      },
    })
  }
  console.log('Surveyor users created')

  // 5. Look up users for references
  const engineerUsers = await Promise.all(
    engineers.map(e => prisma.user.findUnique({ where: { email: e.email } }))
  )
  const surveyorUsers = await Promise.all(
    surveyors.map(s => prisma.user.findUnique({ where: { email: s.email } }))
  )

  // 6. Create Clients
  const clients = [
    {
      companyName: 'Tata Realty & Infrastructure Ltd',
      contactPerson: 'Suresh Mehta',
      email: 'suresh@tatar Realty.com',
      phone: '+91 22 6665 8000',
      address: 'Bombay House, 24 Homi Mody Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India',
      gstNumber: '27AABCT1234F1Z5',
      panNumber: 'AABCT1234F',
    },
    {
      companyName: 'DLF Limited',
      contactPerson: 'Mohit Gupta',
      email: 'mohit@dlf.in',
      phone: '+91 124 456 7890',
      address: 'DLF Centre, 14th Floor',
      city: 'Gurugram',
      state: 'Haryana',
      zipCode: '122002',
      country: 'India',
      gstNumber: '06AABCD5678G1Z8',
      panNumber: 'AABCD5678G',
    },
    {
      companyName: 'Larsen & Toubro Ltd',
      contactPerson: 'Anil Kapoor',
      email: 'anil@ltindia.com',
      phone: '+91 22 6752 5678',
      address: 'L&T House, N.M. Marg',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India',
      gstNumber: '27AABCL9012H1Z3',
      panNumber: 'AABCL9012H',
    },
    {
      companyName: 'Godrej Properties Ltd',
      contactPerson: 'Pirojsha Godrej',
      email: 'pirojsha@godrejproperty.com',
      phone: '+91 22 6188 8000',
      address: 'Godrej BKC, Plot C-68',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400051',
      country: 'India',
      gstNumber: '27AABCG3456I1Z1',
      panNumber: 'AABCG3456I',
    },
    {
      companyName: 'Oberoi Realty Ltd',
      contactPerson: 'Vikas Oberoi',
      email: 'vikas@oberoirealty.com',
      phone: '+91 22 6699 9999',
      address: 'Oberoi Realty, 701 Devcor Tower',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400053',
      country: 'India',
      gstNumber: '27AABCO7890J1Z6',
      panNumber: 'AABCO7890J',
    },
    {
      companyName: 'Brigade Enterprises Ltd',
      contactPerson: 'M R Kamath',
      email: 'mrkamath@brigade.in',
      phone: '+91 80 4040 5050',
      address: 'Brigade Gateway, 26/1 Dr Rajkumar Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560055',
      country: 'India',
      gstNumber: '29AABCB2345K1Z4',
      panNumber: 'AABCB2345K',
    },
  ]

  const createdClients = []
  for (const client of clients) {
    const c = await prisma.client.create({ data: client })
    createdClients.push(c)
  }
  console.log(`${createdClients.length} clients created`)

  // 6. Create Projects
  const projects = [
    {
      name: 'Tata Primus Luxury Residences',
      code: 'PRJ-2024-001',
      description: 'Premium residential project with 200+ apartments in Powai, Mumbai',
      type: 'RESIDENTIAL',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2025-12-31'),
      budget: 450000000,
      actualCost: 180000000,
      address: 'Powai Lake Road, Powai',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.1197,
      longitude: 72.9063,
      area: 250000,
      floors: 32,
      clientId: createdClients[0].id,
      managerId: managerUser.id,
      leadUserId: adminUser.id,
    },
    {
      name: 'DLF Cyber City Phase 4',
      code: 'PRJ-2024-002',
      description: 'Commercial office complex with Grade-A office spaces',
      type: 'COMMERCIAL',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2026-06-30'),
      budget: 800000000,
      actualCost: 320000000,
      address: 'Cyber City, DLF Phase 4',
      city: 'Gurugram',
      state: 'Haryana',
      latitude: 28.4949,
      longitude: 77.0883,
      area: 500000,
      floors: 24,
      clientId: createdClients[1].id,
      managerId: managerUser.id,
    },
    {
      name: 'L&T Tech Center',
      code: 'PRJ-2024-003',
      description: 'Technology park with R&D facilities and data center',
      type: 'INDUSTRIAL',
      status: 'PLANNING',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2026-03-31'),
      budget: 600000000,
      actualCost: 45000000,
      address: 'Navi Mumbai, Airoli',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      latitude: 19.1584,
      longitude: 72.9958,
      area: 350000,
      floors: 12,
      clientId: createdClients[2].id,
      managerId: managerUser.id,
    },
    {
      name: 'Godrej Platinum Interiors',
      code: 'PRJ-2024-004',
      description: 'Premium interior fit-out for residential tower common areas',
      type: 'INTERIOR',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-04-15'),
      endDate: new Date('2024-12-31'),
      budget: 75000000,
      actualCost: 35000000,
      address: 'Vikhroli West, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.1744,
      longitude: 72.9234,
      area: 80000,
      floors: 1,
      clientId: createdClients[3].id,
      managerId: managerUser.id,
    },
    {
      name: 'Oberoi Sky City MEP',
      code: 'PRJ-2024-005',
      description: 'MEP services for mixed-use development',
      type: 'MEP',
      status: 'ON_HOLD',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2025-06-30'),
      budget: 120000000,
      actualCost: 28000000,
      address: 'Borivali East, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.2813,
      longitude: 72.8568,
      area: 180000,
      floors: 40,
      clientId: createdClients[4].id,
      managerId: managerUser.id,
    },
    {
      name: 'Brigade Orchid Renovation',
      code: 'PRJ-2024-006',
      description: 'Complete renovation of clubhouse and amenities',
      type: 'RENOVATION',
      status: 'COMPLETED',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      budget: 35000000,
      actualCost: 32000000,
      address: 'Orchid Layout, North Bangalore',
      city: 'Bengaluru',
      state: 'Karnataka',
      latitude: 13.0827,
      longitude: 77.5877,
      area: 25000,
      floors: 3,
      clientId: createdClients[5].id,
      managerId: managerUser.id,
    },
  ]

  const createdProjects = []
  for (const project of projects) {
    const existing = await prisma.project.findFirst({ where: { code: project.code } })
    if (existing) {
      createdProjects.push(existing)
    } else {
      const p = await prisma.project.create({ data: project })
      createdProjects.push(p)
    }
  }
  console.log(`${createdProjects.length} projects (existing + new)`)

  // 7. Create Surveys
  const surveysInput = [
    {
      title: 'Initial Site Survey - Tata Primus',
      description: 'Comprehensive site survey for foundation assessment',
      type: 'INITIAL',
      status: 'APPROVED',
      scheduledDate: new Date('2024-02-01'),
      completedDate: new Date('2024-02-03'),
      gpsLatitude: 19.1197,
      gpsLongitude: 72.9063,
      weatherCondition: 'Clear, 28°C',
      siteCondition: 'Accessible, level ground',
      accessDetails: 'Main gate from Powai Lake Road',
      projectId: createdProjects[0].id,
      engineerId: (await prisma.user.findUnique({ where: { email: 'priya.sharma@buildsurvey.com' } }))!.id,
    },
    {
      title: 'Structural Assessment - DLF Cyber City',
      description: 'Structural integrity assessment for existing structures',
      type: 'DETAILED',
      status: 'IN_PROGRESS',
      scheduledDate: new Date('2024-04-15'),
      gpsLatitude: 28.4949,
      gpsLongitude: 77.0883,
      weatherCondition: 'Partly cloudy, 35°C',
      siteCondition: 'Active construction zone',
      accessDetails: 'Security pass required from site office',
      projectId: createdProjects[1].id,
      engineerId: (await prisma.user.findUnique({ where: { email: 'amit.patel@buildsurvey.com' } }))!.id,
    },
    {
      title: 'MEP Survey - Oberoi Sky City',
      description: 'MEP installation survey for residential floors',
      type: 'FOLLOW_UP',
      status: 'ASSIGNED',
      scheduledDate: new Date('2024-05-01'),
      projectId: createdProjects[4].id,
      engineerId: (await prisma.user.findUnique({ where: { email: 'sneha.reddy@buildsurvey.com' } }))!.id,
    },
    {
      title: 'Interior Measurement - Godrej Platinum',
      description: 'Detailed measurements for interior fit-out BOQ',
      type: 'DETAILED',
      status: 'SUBMITTED',
      scheduledDate: new Date('2024-04-20'),
      completedDate: new Date('2024-04-22'),
      gpsLatitude: 19.1744,
      gpsLongitude: 72.9234,
      weatherCondition: 'Clear, 30°C',
      siteCondition: 'Indoor, ready for fit-out',
      projectId: createdProjects[3].id,
      engineerId: (await prisma.user.findUnique({ where: { email: 'vikram.singh@buildsurvey.com' } }))!.id,
    },
    {
      title: 'Renovation As-Built - Brigade Orchid',
      description: 'As-built survey for completed renovation',
      type: 'AS_BUILT',
      status: 'APPROVED',
      scheduledDate: new Date('2024-06-15'),
      completedDate: new Date('2024-06-18'),
      gpsLatitude: 13.0827,
      gpsLongitude: 77.5877,
      weatherCondition: 'Rainy, 24°C',
      siteCondition: 'Completed, handover stage',
      projectId: createdProjects[5].id,
      engineerId: (await prisma.user.findUnique({ where: { email: 'priya.sharma@buildsurvey.com' } }))!.id,
    },
    {
      title: 'Final Survey - L&T Tech Center',
      description: 'Pre-construction final site survey',
      type: 'FINAL',
      status: 'DRAFT',
      scheduledDate: new Date('2024-07-01'),
      projectId: createdProjects[2].id,
      engineerId: (await prisma.user.findUnique({ where: { email: 'amit.patel@buildsurvey.com' } }))!.id,
    },
  ]

  const createdSurveys = []
  for (const survey of surveysInput) {
    const existing = await prisma.survey.findFirst({ where: { title: survey.title } })
    if (existing) {
      createdSurveys.push(existing)
    } else {
      const s = await prisma.survey.create({ data: survey })
      createdSurveys.push(s)
    }
  }
  console.log(`${createdSurveys.length} surveys (existing + new)`)

  // 8. Create Leads
  const leads = [
    { name: 'Arjun Mehta', email: 'arjun@shapoorji.com', phone: '+91 98765 43301', company: 'Shapoorji Pallonji', source: 'Referral', status: 'QUALIFIED', priority: 'HIGH', estimatedValue: 50000000, assignedToId: managerUser.id },
    { name: 'Deepa Iyer', email: 'deepa@ashokleyland.in', phone: '+91 98765 43302', company: 'Ashok Leyland Realty', source: 'Website', status: 'NEW', priority: 'MEDIUM', estimatedValue: 30000000 },
    { name: 'Karthik Menon', email: 'karthik@kalyan.in', phone: '+91 98765 43303', company: 'Kalyan Developers', source: 'Cold Call', status: 'CONTACTED', priority: 'LOW', estimatedValue: 20000000, assignedToId: managerUser.id },
    { name: 'Nisha Agarwal', email: 'nisha@prestige.in', phone: '+91 98765 43304', company: 'Prestige Group', source: 'Email Campaign', status: 'PROPOSAL', priority: 'HIGH', estimatedValue: 80000000, assignedToId: managerUser.id },
    { name: 'Ravi Krishnan', email: 'ravi@sobha.com', phone: '+91 98765 43305', company: 'Sobha Ltd', source: 'Trade Show', status: 'NEGOTIATION', priority: 'MEDIUM', estimatedValue: 45000000, assignedToId: managerUser.id },
  ]

  for (const lead of leads) {
    const existing = await prisma.lead.findFirst({ where: { email: lead.email } })
    if (!existing) await prisma.lead.create({ data: lead })
  }
  console.log(`${leads.length} leads (existing + new)`)

  // 9. Create BOQ Items for Project 1
  const boqItems = [
    { serialNumber: 1, description: 'Earthwork Excavation', category: 'Earthwork', unit: 'Cum', quantity: 12500, unitRate: 350, amount: 4375000, projectId: createdProjects[0].id },
    { serialNumber: 2, description: 'PCC Foundation (1:4:8)', category: 'Concrete', unit: 'Cum', quantity: 3200, unitRate: 4500, amount: 14400000, projectId: createdProjects[0].id },
    { serialNumber: 3, description: 'RCC Foundation (M30)', category: 'Concrete', unit: 'Cum', quantity: 5600, unitRate: 6500, amount: 36400000, projectId: createdProjects[0].id },
    { serialNumber: 4, description: 'Brick Masonry (9")', category: 'Masonry', unit: 'Cum', quantity: 8500, unitRate: 5200, amount: 44200000, projectId: createdProjects[0].id },
    { serialNumber: 5, description: 'Plastering (12mm)', category: 'Finishing', unit: 'Sqm', quantity: 45000, unitRate: 180, amount: 8100000, projectId: createdProjects[0].id },
    { serialNumber: 6, description: 'Painting (Internal)', category: 'Finishing', unit: 'Sqm', quantity: 38000, unitRate: 120, amount: 4560000, projectId: createdProjects[0].id },
    { serialNumber: 7, description: 'CPVC Plumbing', category: 'Plumbing', unit: 'Rmt', quantity: 12000, unitRate: 450, amount: 5400000, projectId: createdProjects[0].id },
    { serialNumber: 8, description: 'Electrical Wiring', category: 'Electrical', unit: 'Rmt', quantity: 25000, unitRate: 280, amount: 7000000, projectId: createdProjects[0].id },
    { serialNumber: 9, description: 'AC Ducting', category: 'HVAC', unit: 'Sqm', quantity: 8000, unitRate: 850, amount: 6800000, projectId: createdProjects[0].id },
    { serialNumber: 10, description: 'Floor Tiles (Vitrified)', category: 'Finishing', unit: 'Sqm', quantity: 32000, unitRate: 650, amount: 20800000, projectId: createdProjects[0].id },
  ]

  for (const item of boqItems) {
    const existing = await prisma.bOQItem.findFirst({ where: { description: item.description, projectId: item.projectId } })
    if (!existing) await prisma.bOQItem.create({ data: item })
  }
  console.log(`${boqItems.length} BOQ items (existing + new)`)

  // 10. Create Quotations
  const existingQuotation = await prisma.quotation.findFirst({ where: { quotationNumber: 'QUO-2024-001' } })
  const quotation1 = existingQuotation || await prisma.quotation.create({
    data: {
      quotationNumber: 'QUO-2024-001',
      title: 'Survey & BOQ - Tata Primus Residences',
      totalAmount: 2500000,
      taxAmount: 450000,
      discountAmount: 125000,
      grandTotal: 2825000,
      validUntil: new Date('2024-12-31'),
      terms: 'Payment: 50% advance, 50% on completion. Valid for 30 days.',
      status: 'PAID',
      projectId: createdProjects[0].id,
      items: {
        create: [
          { description: 'Initial Site Survey', unit: 'LS', quantity: 1, unitRate: 500000, amount: 500000 },
          { description: 'Detailed Measurement Survey', unit: 'LS', quantity: 1, unitRate: 750000, amount: 750000 },
          { description: 'BOQ Preparation', unit: 'LS', quantity: 1, unitRate: 600000, amount: 600000 },
          { description: 'Photo Documentation', unit: 'LS', quantity: 1, unitRate: 150000, amount: 150000 },
          { description: 'Risk Assessment Report', unit: 'LS', quantity: 1, unitRate: 250000, amount: 250000 },
          { description: 'Project Monitoring (6 months)', unit: 'Month', quantity: 6, unitRate: 41667, amount: 250000 },
        ],
      },
    },
  })
  console.log('Quotation created:', quotation1.quotationNumber)

  // 11. Create Settings
  const settings = [
    { key: 'app_name', value: 'BuildSurvey Pro', group: 'general', description: 'Application name' },
    { key: 'app_version', value: '1.0.0', group: 'general', description: 'Application version' },
    { key: 'company_name', value: 'BuildSurvey Pro Pvt Ltd', group: 'company', description: 'Company name' },
    { key: 'company_address', value: '42, Business Park, Andheri East', group: 'company', description: 'Company address' },
    { key: 'company_phone', value: '+91 22 4567 8900', group: 'company', description: 'Company phone' },
    { key: 'company_email', value: 'info@buildsurvey.com', group: 'company', description: 'Company email' },
    { key: 'company_gst', value: '27AABCB1234N1Z5', group: 'company', description: 'GST Number' },
    { key: 'company_pan', value: 'AABCB1234N', group: 'company', description: 'PAN Number' },
    { key: 'currency', value: 'INR', group: 'general', description: 'Default currency' },
    { key: 'timezone', value: 'Asia/Kolkata', group: 'general', description: 'Default timezone' },
    { key: 'date_format', value: 'DD/MM/YYYY', group: 'general', description: 'Date format' },
    { key: 'items_per_page', value: '25', group: 'general', description: 'Items per page' },
    { key: 'primary_color', value: '#2563eb', group: 'appearance', description: 'Primary theme color' },
    { key: 'sidebar_theme', value: 'dark', group: 'appearance', description: 'Sidebar color theme' },
    { key: 'password_min_length', value: '8', group: 'security', description: 'Minimum password length' },
    { key: 'session_timeout', value: '60', group: 'security', description: 'Session timeout in minutes' },
    { key: 'smtp_host', value: 'smtp.gmail.com', group: 'email', description: 'SMTP host' },
    { key: 'smtp_port', value: '587', group: 'email', description: 'SMTP port' },
    { key: 'max_file_size', value: '52428800', group: 'storage', description: 'Max file upload size in bytes (50MB)' },
    { key: 'auto_backup', value: 'true', group: 'backup', description: 'Enable automatic backups' },
    { key: 'backup_frequency', value: 'daily', group: 'backup', description: 'Backup frequency' },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log(`${settings.length} settings created`)

  // 12. Create Master Categories
  const categories = [
    { name: 'Material Types', code: 'MAT', description: 'Construction material types' },
    { name: 'Measurement Units', code: 'UNIT', description: 'Units of measurement' },
    { name: 'Survey Categories', code: 'SURVEY_CAT', description: 'Survey classification categories' },
    { name: 'Project Types', code: 'PROJ_TYPE', description: 'Types of projects' },
    { name: 'Risk Categories', code: 'RISK', description: 'Risk classification' },
    { name: 'Document Types', code: 'DOC', description: 'Document classification' },
    { name: 'Lead Sources', code: 'LEAD_SRC', description: 'Source of leads' },
    { name: 'Payment Terms', code: 'PAY_TERM', description: 'Payment terms' },
    { name: 'Tax Codes', code: 'TAX', description: 'Tax code classification' },
    { name: 'Cities', code: 'CITY', description: 'City master' },
  ]

  for (const cat of categories) {
    const existing = await prisma.masterCategory.findFirst({ where: { code: cat.code } })
    if (!existing) {
      await prisma.masterCategory.create({ data: cat })
    }
  }
  console.log(`${categories.length} master categories created`)

  // 13. Create Master Items for Measurement Units
  const unitCategory = await prisma.masterCategory.findFirst({ where: { code: 'UNIT' } })
  if (unitCategory) {
    const units = [
      { name: 'Square Feet', code: 'SQFT', unit: 'Sq Ft' },
      { name: 'Square Meter', code: 'SQM', unit: 'Sqm' },
      { name: 'Cubic Feet', code: 'CUFT', unit: 'Cu Ft' },
      { name: 'Cubic Meter', code: 'CUM', unit: 'Cum' },
      { name: 'Running Meter', code: 'RMT', unit: 'Rmt' },
      { name: 'Numbers', code: 'NOS', unit: 'Nos' },
      { name: 'Kilogram', code: 'KG', unit: 'Kg' },
      { name: 'Quintal', code: 'QTL', unit: 'Qtl' },
      { name: 'Ton', code: 'TON', unit: 'Ton' },
      { name: 'Liter', code: 'LTR', unit: 'Ltr' },
      { name: 'Each', code: 'EA', unit: 'Ea' },
      { name: 'Lot', code: 'LS', unit: 'LS' },
    ]

    for (const unit of units) {
      const existing = await prisma.masterItem.findFirst({ where: { code: unit.code } })
      if (!existing) {
        await prisma.masterItem.create({ data: { ...unit, categoryId: unitCategory.id } })
      }
    }
    console.log(`${units.length} measurement units created`)
  }

  // 14. Create Audit Logs
  const auditActions = [
    { userId: adminUser.id, action: 'CREATED', entityType: 'User', entityId: adminUser.id, ipAddress: '127.0.0.1' },
    { userId: adminUser.id, action: 'CREATED', entityType: 'Project', entityId: createdProjects[0].id, ipAddress: '127.0.0.1' },
    { userId: managerUser.id, action: 'ASSIGNED', entityType: 'Survey', entityId: createdSurveys[0].id, ipAddress: '192.168.1.100' },
    { userId: adminUser.id, action: 'APPROVED', entityType: 'Quotation', entityId: quotation1.id, ipAddress: '127.0.0.1' },
  ]

  for (const log of auditActions) {
    await prisma.auditLog.create({ data: log })
  }
  console.log(`${auditActions.length} audit logs created`)

  // 16. Workflows (projectId is required)
  const workflowData = [
    { name: 'Site Survey Approval', description: 'Standard workflow for site survey completion and approval', status: 'ACTIVE' as const, projectId: createdProjects[0].id, totalSteps: 4 },
    { name: 'Material Procurement', description: 'Workflow for material ordering and delivery tracking', status: 'ACTIVE' as const, projectId: createdProjects[1].id, totalSteps: 4 },
    { name: 'Quality Inspection', description: 'Quality check workflow for completed construction phases', status: 'ACTIVE' as const, projectId: createdProjects[2].id, totalSteps: 3 },
    { name: 'Client Approval Chain', description: 'Multi-step client approval for design changes', status: 'DRAFT' as const, projectId: createdProjects[3].id, totalSteps: 4 },
    { name: 'Safety Compliance Review', description: 'Safety inspection and compliance verification workflow', status: 'ACTIVE' as const, projectId: createdProjects[4].id, totalSteps: 3 },
    { name: 'Invoice Approval Process', description: 'Finance team approval for contractor invoices', status: 'ACTIVE' as const, projectId: createdProjects[5].id, totalSteps: 2 },
  ]
  const workflowRecords: any[] = []
  for (const wf of workflowData) {
    const record = await prisma.workflow.create({
      data: {
        ...wf,
        createdBy: adminUser.id,
      },
    })
    workflowRecords.push(record)
  }
  console.log(`${workflowData.length} workflows created`)

  // 17. Workflow Steps (stepNumber, workflowId, assignedToId)
  const stepTemplates = [
    ['Submit Survey', 'Review by Manager', 'Client Approval', 'Final Sign-off'],
    ['Raise Requisition', 'Manager Approval', 'Purchase Order', 'Delivery Confirmation'],
    ['Initial Inspection', 'Quality Testing', 'Report Generation'],
    ['Design Review', 'Cost Analysis', 'Client Presentation', 'Final Decision'],
  ]
  for (let i = 0; i < Math.min(workflowRecords.length, stepTemplates.length); i++) {
    const steps = stepTemplates[i]
    for (let j = 0; j < steps.length; j++) {
      await prisma.workflowStep.create({
        data: {
          workflowId: workflowRecords[i].id,
          stepNumber: j + 1,
          name: steps[j],
          assignedToId: j === 0 ? engineerUsers[0].id : j === 1 ? managerUser.id : adminUser.id,
          status: j === 0 ? 'DONE' as const : j === 1 ? 'IN_PROGRESS' as const : 'TODO' as const,
        },
      })
    }
  }
  console.log('Workflow steps created')

  // 18. Approvals (entityType, entityId, requestedById required)
  const firstBoqItem = await prisma.bOQItem.findFirst({ where: { projectId: createdProjects[0].id } })
  const approvalData = [
    { entityType: 'SURVEY', entityId: createdSurveys[0].id, status: 'PENDING' as const, requestedById: engineerUsers[0].id, approvedById: null, comments: 'Site survey completed, pending manager review' },
    { entityType: 'BOQ_ITEM', entityId: firstBoqItem?.id || 'placeholder', status: 'PENDING' as const, requestedById: adminUser.id, approvedById: null, comments: 'Procurement request for 50 tons TMT steel' },
    { entityType: 'SURVEY', entityId: createdSurveys[1].id, status: 'APPROVED' as const, requestedById: engineerUsers[1].id, approvedById: managerUser.id, comments: 'Quality test results reviewed and approved' },
    { entityType: 'QUOTATION', entityId: quotation1.id, status: 'PENDING' as const, requestedById: adminUser.id, approvedById: null, comments: 'Client requested modification to 3rd floor layout' },
    { entityType: 'SURVEY', entityId: createdSurveys[2].id, status: 'APPROVED' as const, requestedById: engineerUsers[2].id, approvedById: managerUser.id, comments: 'Monthly safety compliance audit completed' },
    { entityType: 'INVOICE', entityId: 'invoice-placeholder', status: 'APPROVED' as const, requestedById: adminUser.id, approvedById: managerUser.id, comments: 'Contractor invoice for Phase 1 work approved' },
    { entityType: 'SURVEY', entityId: createdSurveys[3].id, status: 'REJECTED' as const, requestedById: engineerUsers[3].id, approvedById: managerUser.id, comments: 'Survey data incomplete, needs revision' },
    { entityType: 'SURVEY', entityId: createdSurveys[4].id, status: 'PENDING' as const, requestedById: engineerUsers[0].id, approvedById: null, comments: 'Monthly safety inspection report pending' },
  ]
  for (const approval of approvalData) {
    await prisma.approval.create({ data: approval })
  }
  console.log(`${approvalData.length} approvals created`)

  // 19. Cost Estimations (estimatedAmount, actualAmount, projectId required)
  const estimationData = [
    { category: 'Civil Works', description: 'Foundation and structural work', estimatedAmount: 4500000, actualAmount: 4200000, projectId: createdProjects[0].id },
    { category: 'Electrical', description: 'Electrical wiring and fixtures', estimatedAmount: 1200000, actualAmount: 1350000, projectId: createdProjects[0].id },
    { category: 'Plumbing', description: 'Water supply and drainage system', estimatedAmount: 800000, actualAmount: 750000, projectId: createdProjects[0].id },
    { category: 'Finishing', description: 'Painting, flooring, and fixtures', estimatedAmount: 2000000, actualAmount: null, projectId: createdProjects[1].id },
    { category: 'Civil Works', description: 'Road widening subgrade preparation', estimatedAmount: 3200000, actualAmount: 3100000, projectId: createdProjects[2].id },
    { category: 'Landscaping', description: 'Garden and green belt development', estimatedAmount: 500000, actualAmount: null, projectId: createdProjects[3].id },
    { category: 'MEP', description: 'HVAC system installation', estimatedAmount: 1800000, actualAmount: 1650000, projectId: createdProjects[4].id },
    { category: 'Interior', description: 'Modular kitchen and wardrobes', estimatedAmount: 900000, actualAmount: null, projectId: createdProjects[5].id },
  ]
  for (const est of estimationData) {
    await prisma.costEstimation.create({ data: est })
  }
  console.log(`${estimationData.length} cost estimations created`)

  // 20. Digital Signatures (entityType, entityId, signatureData, userId required)
  const sigData = [
    { entityType: 'SURVEY', entityId: createdSurveys[0].id, userId: adminUser.id, signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRU5ErkJggg==' },
    { entityType: 'SURVEY', entityId: createdSurveys[1].id, userId: managerUser.id, signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRU5ErkJggg==' },
    { entityType: 'MEASUREMENT', entityId: 'meas-1', userId: engineerUsers[0].id, signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRU5ErkJggg==' },
    { entityType: 'DAILY_REPORT', entityId: 'dpr-1', userId: engineerUsers[1].id, signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRU5ErkJggg==' },
    { entityType: 'QUOTATION', entityId: quotation1.id, userId: adminUser.id, signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRU5ErkJggg==' },
    { entityType: 'SURVEY', entityId: createdSurveys[2].id, userId: managerUser.id, signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRU5ErkJggg==' },
  ]
  for (const sig of sigData) {
    await prisma.digitalSignature.create({ data: sig })
  }
  console.log(`${sigData.length} digital signatures created`)

  // 21. Documents (type is DocumentType enum, projectId + uploadedById required)
  const docData = [
    { title: 'Site Survey Report - Metro Phase II', type: 'REPORT' as const, projectId: createdProjects[0].id, uploadedById: engineerUsers[0].id, fileUrl: '/docs/survey-report-metro.pdf', filename: 'survey-report-metro.pdf', fileSize: 2500000 },
    { title: 'BOQ Master Sheet', type: 'REPORT' as const, projectId: createdProjects[1].id, uploadedById: adminUser.id, fileUrl: '/docs/boq-master.xlsx', filename: 'boq-master.xlsx', fileSize: 1200000 },
    { title: 'Safety Compliance Certificate', type: 'OTHER' as const, projectId: createdProjects[2].id, uploadedById: managerUser.id, fileUrl: '/docs/safety-cert.pdf', filename: 'safety-cert.pdf', fileSize: 800000 },
    { title: 'Client Approval Letter', type: 'CORRESPONDENCE' as const, projectId: createdProjects[3].id, uploadedById: adminUser.id, fileUrl: '/docs/client-approval.pdf', filename: 'client-approval.pdf', fileSize: 500000 },
    { title: 'Material Test Report - Steel', type: 'REPORT' as const, projectId: createdProjects[4].id, uploadedById: engineerUsers[1].id, fileUrl: '/docs/steel-test-report.pdf', filename: 'steel-test-report.pdf', fileSize: 1500000 },
    { title: 'Structural Design Drawing', type: 'DRAWING' as const, projectId: createdProjects[0].id, uploadedById: engineerUsers[0].id, fileUrl: '/docs/structural-drawing.pdf', filename: 'structural-drawing.pdf', fileSize: 4200000 },
    { title: 'Contract Agreement', type: 'CONTRACT' as const, projectId: createdProjects[1].id, uploadedById: adminUser.id, fileUrl: '/docs/contract.pdf', filename: 'contract.pdf', fileSize: 3000000 },
  ]
  for (const doc of docData) {
    await prisma.document.create({ data: doc })
  }
  console.log(`${docData.length} documents created`)

  // 22. Photos (surveyId is required, url + filename required)
  const photoData = [
    { caption: 'Foundation work progress', surveyId: createdSurveys[0].id, url: '/photos/foundation-progress.jpg', filename: 'foundation-progress.jpg' },
    { caption: 'Steel reinforcement check', surveyId: createdSurveys[0].id, url: '/photos/steel-reinforcement.jpg', filename: 'steel-reinforcement.jpg' },
    { caption: 'Excavation complete', surveyId: createdSurveys[1].id, url: '/photos/excavation-complete.jpg', filename: 'excavation-complete.jpg' },
    { caption: 'Safety equipment inspection', surveyId: createdSurveys[2].id, url: '/photos/safety-inspection.jpg', filename: 'safety-inspection.jpg' },
    { caption: 'Road marking final', surveyId: createdSurveys[3].id, url: '/photos/road-marking.jpg', filename: 'road-marking.jpg' },
    { caption: 'Crack detection - Column B3', surveyId: createdSurveys[4].id, url: '/photos/crack-detection.jpg', filename: 'crack-detection.jpg' },
    { caption: 'Painting - Level 2', surveyId: createdSurveys[5].id, url: '/photos/painting-level2.jpg', filename: 'painting-level2.jpg' },
    { caption: 'Plumbing rough-in', surveyId: createdSurveys[0].id, url: '/photos/plumbing-roughin.jpg', filename: 'plumbing-roughin.jpg' },
    { caption: 'Site barricade setup', surveyId: createdSurveys[1].id, url: '/photos/barricade-setup.jpg', filename: 'barricade-setup.jpg' },
    { caption: 'Roof slab pouring', surveyId: createdSurveys[2].id, url: '/photos/roof-slab.jpg', filename: 'roof-slab.jpg' },
  ]
  for (const photo of photoData) {
    await prisma.photo.create({ data: { ...photo, latitude: 21.1458 + Math.random() * 0.05, longitude: 79.0882 + Math.random() * 0.05 } })
  }
  console.log(`${photoData.length} photos created`)

  // 23. Measurements (surveyId is required, category required)
  const measData = [
    { category: 'Concrete', description: 'Foundation concrete - Block A', length: 10, width: 5, height: 0.9, area: 50, volume: 45, unit: 'm', surveyId: createdSurveys[0].id },
    { category: 'Steel', description: 'Steel reinforcement - Grade Fe500', length: 12, width: 0.5, height: 0.5, area: 6, volume: 1.5, unit: 'kg', surveyId: createdSurveys[0].id },
    { category: 'Masonry', description: 'Brickwork - External walls', length: 20, width: 0.23, height: 3, area: 60, volume: 13.8, unit: 'm', surveyId: createdSurveys[1].id },
    { category: 'Plastering', description: 'Internal wall plastering', length: 15, width: 3, height: 0.012, area: 45, volume: 0.54, unit: 'm', surveyId: createdSurveys[2].id },
    { category: 'Flooring', description: 'Vitrified tile flooring', length: 8, width: 6, height: 0.02, area: 48, volume: 0.96, unit: 'm', surveyId: createdSurveys[3].id },
    { category: 'Painting', description: 'Primer coat application', length: 10, width: 3, height: 0.001, area: 30, volume: 0.03, unit: 'm', surveyId: createdSurveys[4].id },
    { category: 'Waterproofing', description: 'Terrace waterproofing', length: 20, width: 10, height: 0.005, area: 200, volume: 1, unit: 'm', surveyId: createdSurveys[5].id },
    { category: 'Electrical', description: 'Conduit laying', length: 50, width: 0.025, height: 0.025, area: 1.25, volume: 0.031, unit: 'm', surveyId: createdSurveys[0].id },
  ]
  for (const meas of measData) {
    await prisma.measurement.create({ data: meas })
  }
  console.log(`${measData.length} measurements created`)

  // 24. Risk Assessments (surveyId + identifiedById required, level is RiskLevel enum)
  const riskData = [
    { title: 'Monsoon delay risk', description: 'Heavy rainfall expected Jul-Sep, may delay foundation work', level: 'HIGH' as const, mitigation: 'Advance procurement, weather monitoring', surveyId: createdSurveys[0].id, identifiedById: engineerUsers[0].id },
    { title: 'Material price fluctuation', description: 'Steel prices rising 8-12% YoY', level: 'MEDIUM' as const, mitigation: 'Bulk purchasing, forward contracts', surveyId: createdSurveys[1].id, identifiedById: managerUser.id },
    { title: 'Labor shortage during festival', description: 'Diwali period may see 30% workforce reduction', level: 'MEDIUM' as const, mitigation: 'Advance scheduling, local labor sourcing', surveyId: createdSurveys[2].id, identifiedById: engineerUsers[1].id },
    { title: 'Foundation soil instability', description: 'Soil test shows clay content above threshold', level: 'HIGH' as const, mitigation: 'Additional soil testing, pile foundation design', surveyId: createdSurveys[3].id, identifiedById: engineerUsers[0].id },
    { title: 'Equipment breakdown', description: 'Critical crane may require maintenance', level: 'LOW' as const, mitigation: 'Regular maintenance schedule, backup equipment', surveyId: createdSurveys[4].id, identifiedById: engineerUsers[2].id },
    { title: 'Client design changes', description: 'Frequent changes in facade design', level: 'HIGH' as const, mitigation: 'Freeze design early, change order process', surveyId: createdSurveys[5].id, identifiedById: managerUser.id },
  ]
  for (const risk of riskData) {
    await prisma.riskAssessment.create({ data: risk })
  }
  console.log(`${riskData.length} risk assessments created`)

  // 25. Material Requirements (surveyId required, materialName required)
  const matData = [
    { materialName: 'TMT Steel Fe500D', specification: '16mm dia, IS 1786', quantity: 50, unit: 'tons', estimatedCost: 4000000, surveyId: createdSurveys[0].id },
    { materialName: 'OPC 53 Cement', specification: 'UltraTech/ACC, IS 12269', quantity: 200, unit: 'bags', estimatedCost: 140000, surveyId: createdSurveys[0].id },
    { materialName: 'River Sand', specification: 'Fine-graded, zone II', quantity: 150, unit: 'cum', estimatedCost: 450000, surveyId: createdSurveys[1].id },
    { materialName: 'Crushed Aggregate', specification: '20mm, IS 383', quantity: 100, unit: 'cum', estimatedCost: 300000, surveyId: createdSurveys[1].id },
    { materialName: 'Red Bricks', specification: 'First class, IS 1077', quantity: 50000, unit: 'nos', estimatedCost: 350000, surveyId: createdSurveys[2].id },
    { materialName: 'Ready Mix Concrete', specification: 'M25 grade, IS 456', quantity: 200, unit: 'cum', estimatedCost: 1600000, surveyId: createdSurveys[3].id },
    { materialName: 'Aluminium Windows', specification: 'Powder coated, 5mm glass', quantity: 120, unit: 'nos', estimatedCost: 960000, surveyId: createdSurveys[4].id },
    { materialName: 'Electrical Cable', specification: '4 sqmm copper, IS 694', quantity: 5000, unit: 'meters', estimatedCost: 250000, surveyId: createdSurveys[5].id },
  ]
  for (const mat of matData) {
    await prisma.materialRequirement.create({ data: mat })
  }
  console.log(`${matData.length} material requirements created`)

  // 26. Notifications (userId required)
  const notifData = [
    { title: 'New survey assigned', message: 'Survey S-001 assigned to you for Metro Phase II', type: 'INFO' as const, userId: engineerUsers[0].id },
    { title: 'Invoice overdue', message: 'Invoice INV-001 payment is 15 days overdue', type: 'WARNING' as const, userId: adminUser.id },
    { title: 'GPS alert - Geofence exit', message: 'Raj Mehta left site area at 2:30 PM', type: 'ERROR' as const, userId: managerUser.id },
    { title: 'Approval required', message: 'Survey report pending your approval', type: 'INFO' as const, userId: managerUser.id },
    { title: 'Material shortage warning', message: 'TMT steel stock below 10 tons at Metro site', type: 'WARNING' as const, userId: engineerUsers[1].id },
    { title: 'Document uploaded', message: 'New structural drawing uploaded for Green Valley', type: 'INFO' as const, userId: adminUser.id },
    { title: 'Measurement verified', message: 'Foundation concrete measurement approved', type: 'SUCCESS' as const, userId: engineerUsers[0].id },
    { title: 'Risk escalated', message: 'Monsoon risk severity increased to CRITICAL', type: 'ERROR' as const, userId: managerUser.id },
  ]
  for (const notif of notifData) {
    await prisma.notification.create({ data: notif })
  }
  console.log(`${notifData.length} notifications created`)

  // 27. Activities
  const activityData = [
    { action: 'APPROVED' as const, description: 'Survey S-001 completed', entityType: 'Survey', entityId: 'S-001', projectId: createdProjects[0].id, userId: adminUser.id },
    { action: 'CREATED' as const, description: 'Invoice INV-001 generated', entityType: 'Invoice', entityId: 'INV-001', projectId: createdProjects[1].id, userId: adminUser.id },
    { action: 'UPLOADED' as const, description: 'Photo uploaded for site inspection', entityType: 'Photo', entityId: 'P-001', projectId: createdProjects[2].id, userId: engineerUsers[1].id },
    { action: 'UPDATED' as const, description: 'Risk assessment updated', entityType: 'Risk', entityId: 'R-001', projectId: createdProjects[3].id, userId: managerUser.id },
    { action: 'CREATED' as const, description: 'BOQ item added', entityType: 'BOQ', entityId: 'BOQ-001', projectId: createdProjects[0].id, userId: adminUser.id },
    { action: 'ASSIGNED' as const, description: 'GPS tracking started', entityType: 'GPS', entityId: 'GPS-001', projectId: createdProjects[4].id, userId: engineerUsers[0].id },
  ]
  for (const act of activityData) {
    await prisma.activity.create({
      data: {
        action: act.action,
        description: act.description,
        entityType: act.entityType,
        entityId: act.entityId,
        project: { connect: { id: act.projectId } },
        user: { connect: { id: act.userId } },
      },
    })
  }
  console.log(`${activityData.length} activities created`)

  // 28. Settings (group instead of category)
  const additionalSettings = [
    { key: 'company.name', value: 'BuildSurvey Pro Construction', group: 'COMPANY' },
    { key: 'company.gstin', value: '27AABCU9603R1ZM', group: 'COMPANY' },
    { key: 'company.phone', value: '+91 98765 43210', group: 'COMPANY' },
    { key: 'company.email', value: 'admin@buildsurvey.in', group: 'COMPANY' },
    { key: 'company.address', value: '123 Construction Nagar, Nagpur 440001', group: 'COMPANY' },
    { key: 'billing.gstRate', value: '18', group: 'BILLING' },
    { key: 'billing.paymentTerms', value: 'Net 30 days', group: 'BILLING' },
    { key: 'gps.trackingInterval', value: '8', group: 'GPS' },
    { key: 'gps.geofenceRadius', value: '500', group: 'GPS' },
    { key: 'notifications.emailEnabled', value: 'true', group: 'NOTIFICATIONS' },
    { key: 'notifications.smsEnabled', value: 'false', group: 'NOTIFICATIONS' },
    { key: 'reports.autoGenerate', value: 'true', group: 'REPORTS' },
  ]
  for (const setting of additionalSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log(`${additionalSettings.length} settings created`)

  console.log('\nSeeding completed successfully!')
  console.log('================================')
  console.log('Login credentials:')
  console.log('Admin:   admin@buildsurvey.com / Admin@123')
  console.log('Manager: manager@buildsurvey.com / Manager@123')
  console.log('Engineer: priya.sharma@buildsurvey.com / Engineer@123')
  console.log('================================')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
