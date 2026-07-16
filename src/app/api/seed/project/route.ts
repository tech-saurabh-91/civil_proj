import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const PROJECT_ID = 'f19c10d1-857c-4365-83de-e81b2810239f'

export async function POST() {
  try {
    const results: Record<string, number> = {}

    // 1. BOQ Items
    const boqItems = [
      { serialNumber: 1, description: 'Earthwork Excavation', category: 'Earthwork', unit: 'Cum', quantity: 1250, unitRate: 350 },
      { serialNumber: 2, description: 'PCC Foundation (1:4:8)', category: 'Concrete', unit: 'Cum', quantity: 320, unitRate: 4500 },
      { serialNumber: 3, description: 'RCC Foundation (M30)', category: 'Concrete', unit: 'Cum', quantity: 560, unitRate: 6500 },
      { serialNumber: 4, description: 'Brick Masonry (9")', category: 'Masonry', unit: 'Cum', quantity: 850, unitRate: 5200 },
      { serialNumber: 5, description: 'Plastering (12mm)', category: 'Finishing', unit: 'Sqm', quantity: 4500, unitRate: 180 },
      { serialNumber: 6, description: 'Painting (Internal)', category: 'Finishing', unit: 'Sqm', quantity: 3800, unitRate: 120 },
      { serialNumber: 7, description: 'CPVC Plumbing', category: 'Plumbing', unit: 'Rmt', quantity: 1200, unitRate: 450 },
      { serialNumber: 8, description: 'Electrical Wiring', category: 'Electrical', unit: 'Rmt', quantity: 2500, unitRate: 280 },
      { serialNumber: 9, description: 'AC Ducting', category: 'HVAC', unit: 'Sqm', quantity: 800, unitRate: 850 },
      { serialNumber: 10, description: 'Floor Tiles (Vitrified)', category: 'Finishing', unit: 'Sqm', quantity: 3200, unitRate: 650 },
    ]
    let boqCount = 0
    for (const item of boqItems) {
      const existing = await (db as any).bOQItem.findFirst({ where: { description: item.description, projectId: PROJECT_ID } })
      if (!existing) {
        await (db as any).bOQItem.create({ data: { ...item, projectId: PROJECT_ID, amount: item.quantity * item.unitRate } })
        boqCount++
      }
    }
    results.boqItems = boqCount

    // 2. Surveys (2 surveys)
    const existingSurveys = await db.survey.findMany({ where: { projectId: PROJECT_ID, isDeleted: false } })
    let surveyCount = existingSurveys.length
    if (surveyCount === 0) {
      const engineer = await db.user.findFirst({ where: { role: 'ENGINEER', isDeleted: false } })
      const s1 = await db.survey.create({
        data: {
          title: 'Initial Site Survey - Saurabh Singh Project',
          description: 'Comprehensive initial site survey for residential construction',
          type: 'INITIAL',
          status: 'APPROVED',
          projectId: PROJECT_ID,
          engineerId: engineer?.id || null,
          scheduledDate: new Date('2026-07-10'),
          completedDate: new Date('2026-07-12'),
          gpsLatitude: 21.1458,
          gpsLongitude: 79.0882,
          weatherCondition: 'Clear, 32°C',
          siteCondition: 'Accessible, level ground',
        },
      })
      const s2 = await db.survey.create({
        data: {
          title: 'Detailed Structural Survey - Saurabh Singh Project',
          description: 'Detailed structural assessment for foundation design',
          type: 'DETAILED',
          status: 'SUBMITTED',
          projectId: PROJECT_ID,
          engineerId: engineer?.id || null,
          scheduledDate: new Date('2026-07-15'),
          gpsLatitude: 21.1460,
          gpsLongitude: 79.0885,
        },
      })
      surveyCount = 2

      // Checklist items for survey 1
      const checklistItems = [
        { category: 'STRUCTURAL', item: 'Foundation depth verification', isCompleted: true },
        { category: 'STRUCTURAL', item: 'Soil test results review', isCompleted: true },
        { category: 'ELECTRICAL', item: 'Power supply point check', isCompleted: true },
        { category: 'PLUMBING', item: 'Water supply line location', isCompleted: false },
        { category: 'GENERAL', item: 'Site boundary marking', isCompleted: true },
        { category: 'SAFETY', item: 'Safety barricade installation', isCompleted: false },
      ]
      for (const ci of checklistItems) {
        await db.surveyChecklistItem.create({ data: { ...ci, surveyId: s1.id } })
      }

      // Checklist items for survey 2
      const checklist2 = [
        { category: 'STRUCTURAL', item: 'Column reinforcement check', isCompleted: true },
        { category: 'STRUCTURAL', item: 'Beam depth verification', isCompleted: false },
        { category: 'STRUCTURAL', item: 'Slab thickness measurement', isCompleted: false },
        { category: 'ELECTRICAL', item: 'Conduit layout verification', isCompleted: true },
        { category: 'PLUMBING', item: 'Drainage slope check', isCompleted: false },
      ]
      for (const ci of checklist2) {
        await db.surveyChecklistItem.create({ data: { ...ci, surveyId: s2.id } })
      }
    }

    // 3. Lead for this project
    const existingLead = await db.lead.findFirst({ where: { company: { contains: 'Saurabh', mode: 'insensitive' }, isDeleted: false } })
    let leadCreated = false
    if (!existingLead) {
      const adminUser = await db.user.findFirst({ where: { role: 'ADMIN', isDeleted: false } })
      await db.lead.create({
        data: {
          name: 'Saurabh Singh',
          email: 'saurabh@test.com',
          phone: '9876543210',
          company: 'Saurabh Singh Construction',
          source: 'WEBSITE',
          status: 'WON',
          priority: 'HIGH',
          estimatedValue: 45000000,
          notes: 'Residential project in Nagpur',
          assignedToId: adminUser?.id || null,
        },
      })
      leadCreated = true
    }
    results.lead = leadCreated ? 1 : 0

    // 4. Materials
    const existingMats = await db.materialRequirement.findMany({ where: { surveyId: existingSurveys[0]?.id || '' } })
    let matCount = 0
    if (existingMats.length === 0 && existingSurveys.length > 0) {
      const mats = [
        { materialName: 'TMT Steel Fe500D', specification: '16mm dia, IS 1786', quantity: 50, unit: 'tons', estimatedCost: 4000000, surveyId: existingSurveys[0].id },
        { materialName: 'OPC 53 Cement', specification: 'UltraTech, IS 12269', quantity: 200, unit: 'bags', estimatedCost: 140000, surveyId: existingSurveys[0].id },
        { materialName: 'River Sand', specification: 'Fine-graded, zone II', quantity: 150, unit: 'cum', estimatedCost: 450000, surveyId: existingSurveys[0].id },
        { materialName: 'Red Bricks', specification: 'First class, IS 1077', quantity: 50000, unit: 'nos', estimatedCost: 350000, surveyId: existingSurveys[0].id },
      ]
      for (const m of mats) {
        await db.materialRequirement.create({ data: m })
        matCount++
      }
    }
    results.materials = matCount

    // 5. Risks
    let riskCount = 0
    if (existingSurveys.length > 0) {
      const existingRisks = await db.riskAssessment.findMany({ where: { surveyId: existingSurveys[0].id } })
      if (existingRisks.length === 0) {
        const engineer = await db.user.findFirst({ where: { role: 'ENGINEER', isDeleted: false } })
        const risks = [
          { title: 'Monsoon delay risk', description: 'Heavy rainfall expected Jul-Sep', level: 'HIGH' as const, mitigation: 'Advance procurement, weather monitoring', surveyId: existingSurveys[0].id, identifiedById: engineer?.id || null },
          { title: 'Material price fluctuation', description: 'Steel prices rising 8-12% YoY', level: 'MEDIUM' as const, mitigation: 'Bulk purchasing, forward contracts', surveyId: existingSurveys[0].id, identifiedById: engineer?.id || null },
          { title: 'Foundation soil instability', description: 'Soil test shows clay content above threshold', level: 'HIGH' as const, mitigation: 'Additional soil testing, pile foundation design', surveyId: existingSurveys[0].id, identifiedById: engineer?.id || null },
        ]
        for (const r of risks) {
          await db.riskAssessment.create({ data: r })
          riskCount++
        }
      }
    }
    results.risks = riskCount

    // 6. Notifications
    const manager = await db.user.findFirst({ where: { role: 'MANAGER', isDeleted: false } })
    if (manager) {
      await db.notification.create({
        data: {
          title: 'Survey Completed',
          message: 'Initial Site Survey for Saurabh Singh Project completed and approved',
          type: 'SUCCESS',
          userId: manager.id,
        },
      })
    }
    results.notifications = 1

    return NextResponse.json({ success: true, message: 'Data seeded for Saurabh Singh project', results })
  } catch (error: any) {
    console.error('Seed error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
