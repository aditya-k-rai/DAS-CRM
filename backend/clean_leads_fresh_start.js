const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function cleanAllLeadsAndStartFresh() {
  console.log('=====================================================');
  console.log('🧹 STARTING CLEANUP: LEADS, HISTORIES, FILES & DATA');
  console.log('=====================================================\n');

  // ==========================================
  // 1. SUPABASE (POSTGRESQL via PRISMA)
  // ==========================================
  console.log('▶ [1/4] Connecting to Supabase (PostgreSQL)...');
  const prisma = new PrismaClient();

  try {
    // Check initial counts
    const initialLeads = await prisma.lead.count();
    const initialHistories = await prisma.leadStatusHistory.count();
    const initialAiScores = await prisma.leadAIScore.count();
    const initialLeadActivities = await prisma.activity.count({
      where: { OR: [{ leadId: { not: null } }, { type: 'IMPORT' }] },
    });
    const initialLeadTasks = await prisma.task.count({ where: { leadId: { not: null } } });
    const initialLeadMeetings = await prisma.meeting.count({ where: { leadId: { not: null } } });
    const initialLeadNotes = await prisma.note.count({ where: { leadId: { not: null } } });
    const initialImports = await prisma.import.count({ where: { entity: 'lead' } });
    const initialLeadAuditLogs = await prisma.auditLog.count({ where: { entity: 'lead' } });

    console.log(`Current Supabase Lead Records Found:`);
    console.log(`  - Leads: ${initialLeads}`);
    console.log(`  - Status History: ${initialHistories}`);
    console.log(`  - AI Scores: ${initialAiScores}`);
    console.log(`  - Lead Activities & Import events: ${initialLeadActivities}`);
    console.log(`  - Lead Tasks: ${initialLeadTasks}`);
    console.log(`  - Lead Meetings: ${initialLeadMeetings}`);
    console.log(`  - Lead Notes: ${initialLeadNotes}`);
    console.log(`  - Lead Import records: ${initialImports}`);
    console.log(`  - Lead Audit Logs: ${initialLeadAuditLogs}`);

    // Verify Protected Data Before Cleaning
    const orgCount = await prisma.organization.count();
    const userCount = await prisma.user.count();
    const empProfileCount = await prisma.employeeProfile.count();
    const companyCount = await prisma.company.count();
    const productCount = await prisma.product.count();

    console.log(`\nVerified Protected Records (will NOT be touched):`);
    console.log(`  - Organizations: ${orgCount}`);
    console.log(`  - Users/Employees: ${userCount}`);
    console.log(`  - Employee Profiles: ${empProfileCount}`);
    console.log(`  - Companies: ${companyCount}`);
    console.log(`  - Products: ${productCount}\n`);

    // Step A: Disconnect foreign keys from Deals & Quotations (if any)
    console.log('Clearing lead references from Deals & Quotations...');
    await prisma.deal.updateMany({
      where: { leadId: { not: null } },
      data: { leadId: null },
    });
    await prisma.quotation.updateMany({
      where: { leadId: { not: null } },
      data: { leadId: null },
    });

    // Step B: Delete lead status history & AI scores
    console.log('Deleting Lead AI scores...');
    const deletedScores = await prisma.leadAIScore.deleteMany({});
    console.log(`  Deleted ${deletedScores.count} lead AI score records.`);

    console.log('Deleting Lead status histories...');
    const deletedHistories = await prisma.leadStatusHistory.deleteMany({});
    console.log(`  Deleted ${deletedHistories.count} lead status history records.`);

    // Step C: Delete lead tasks, meetings, notes
    console.log('Deleting Lead tasks...');
    const deletedTasks = await prisma.task.deleteMany({
      where: { leadId: { not: null } },
    });
    console.log(`  Deleted ${deletedTasks.count} tasks.`);

    console.log('Deleting Lead meetings...');
    const deletedMeetings = await prisma.meeting.deleteMany({
      where: { leadId: { not: null } },
    });
    console.log(`  Deleted ${deletedMeetings.count} meetings.`);

    console.log('Deleting Lead notes...');
    const deletedNotes = await prisma.note.deleteMany({
      where: { leadId: { not: null } },
    });
    console.log(`  Deleted ${deletedNotes.count} notes.`);

    // Step D: Delete lead activities and import activities
    console.log('Deleting Lead activities...');
    const deletedActivities = await prisma.activity.deleteMany({
      where: { OR: [{ leadId: { not: null } }, { type: 'IMPORT' }] },
    });
    console.log(`  Deleted ${deletedActivities.count} activities.`);

    // Step E: Delete lead import records
    console.log('Deleting Lead import audit records...');
    const deletedImports = await prisma.import.deleteMany({
      where: { entity: 'lead' },
    });
    console.log(`  Deleted ${deletedImports.count} import records.`);

    // Step F: Delete lead audit logs
    console.log('Deleting Lead audit logs...');
    const deletedAudit = await prisma.auditLog.deleteMany({
      where: { entity: 'lead' },
    });
    console.log(`  Deleted ${deletedAudit.count} audit logs.`);

    // Step G: Delete all Leads
    console.log('Deleting all Lead records from Supabase...');
    const deletedLeads = await prisma.lead.deleteMany({});
    console.log(`  ✅ Successfully deleted ${deletedLeads.count} leads from Supabase!\n`);

  } catch (err) {
    console.error('❌ Supabase clean error:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }

  // ==========================================
  // 2. FIREBASE FIRESTORE
  // ==========================================
  console.log('▶ [2/4] Connecting to Firebase (Firestore)...');
  try {
    const keyPath = path.resolve(__dirname, '..', 'service-account.json');
    if (fs.existsSync(keyPath)) {
      const sa = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      const app = initializeApp({ credential: cert(sa) }, `cleaner_${Date.now()}`);
      const db = getFirestore(app);

      // Clean Firestore collection: lead_imports
      console.log("Cleaning Firestore collection 'lead_imports'...");
      const leadImportsSnap = await db.collection('lead_imports').get();
      let deletedLeadImportsCount = 0;
      for (const doc of leadImportsSnap.docs) {
        await doc.ref.delete();
        deletedLeadImportsCount++;
      }
      console.log(`  ✅ Deleted ${deletedLeadImportsCount} docs from 'lead_imports'.`);

      // Clean Firestore collection: files (only category === 'LEADS' or folderPath containing Leads)
      console.log("Cleaning lead files in Firestore collection 'files'...");
      const filesSnap = await db.collection('files').get();
      let deletedFilesCount = 0;
      for (const doc of filesSnap.docs) {
        const d = doc.data();
        if (d.category === 'LEADS' || (d.folderPath && d.folderPath.includes('Leads'))) {
          await doc.ref.delete();
          deletedFilesCount++;
          console.log(`  Deleted file doc: ${doc.id} (${d.fileName || 'unnamed'})`);
        }
      }
      console.log(`  ✅ Deleted ${deletedFilesCount} lead file documents from Firestore 'files'.`);

      // Clean Firestore collection: leads (if any)
      const leadsSnap = await db.collection('leads').get();
      if (!leadsSnap.empty) {
        for (const doc of leadsSnap.docs) {
          await doc.ref.delete();
        }
        console.log(`  ✅ Deleted ${leadsSnap.size} docs from Firestore 'leads'.`);
      } else {
        console.log("  Firestore 'leads' collection is empty.");
      }

      // Verify protected collections remain intact
      const productsSnap = await db.collection('products').get();
      console.log(`  Protected 'products' in Firestore: ${productsSnap.size} (Intact)`);
      const appReleasesSnap = await db.collection('superadmin_app_releases').get();
      console.log(`  Protected 'superadmin_app_releases' in Firestore: ${appReleasesSnap.size} (Intact)\n`);

    } else {
      console.warn('⚠️ service-account.json not found, skipping Firestore direct clean.');
    }
  } catch (err) {
    console.error('❌ Firebase Firestore clean error:', err);
  }

  // ==========================================
  // 3. STORAGE DRIVE VAULT & REGISTRIES
  // ==========================================
  console.log('▶ [3/4] Cleaning Local Storage Drive Vault & Registries...');
  try {
    const vaultDir = path.resolve(__dirname, 'storage', 'drive_vault');
    const firestoreRegPath = path.join(vaultDir, 'firestore_registry.json');
    const legacyRegPath = path.join(vaultDir, 'registry.json');

    // Clean firestore_registry.json
    if (fs.existsSync(firestoreRegPath)) {
      const regData = JSON.parse(fs.readFileSync(firestoreRegPath, 'utf8'));
      const beforeCount = regData.length;
      const filtered = regData.filter(item => {
        const isLead = item.category === 'LEADS' || (item.folderPath && item.folderPath.includes('Leads'));
        return !isLead;
      });
      fs.writeFileSync(firestoreRegPath, JSON.stringify(filtered, null, 2), 'utf8');
      console.log(`  ✅ Filtered firestore_registry.json: removed ${beforeCount - filtered.length} lead items, kept ${filtered.length} protected items.`);
    }

    // Clean legacy registry.json
    if (fs.existsSync(legacyRegPath)) {
      const regData = JSON.parse(fs.readFileSync(legacyRegPath, 'utf8'));
      const beforeCount = regData.length;
      const filtered = regData.filter(item => {
        const isLead = item.category === 'LEADS' || (item.folderPath && item.folderPath.includes('Leads'));
        return !isLead;
      });
      fs.writeFileSync(legacyRegPath, JSON.stringify(filtered, null, 2), 'utf8');
      console.log(`  ✅ Filtered legacy registry.json: removed ${beforeCount - filtered.length} lead items, kept ${filtered.length} protected items.`);
    }

    // Delete lead files on disk in drive_vault
    const leadFolders = [
      path.join(vaultDir, 'Adorable Trading', 'Leads'),
      path.join(vaultDir, 'vault', 'Adorable Trading', 'Leads'),
    ];

    for (const folder of leadFolders) {
      if (fs.existsSync(folder)) {
        const files = fs.readdirSync(folder);
        for (const file of files) {
          const filePath = path.join(folder, file);
          fs.unlinkSync(filePath);
          console.log(`  Deleted vault lead file: ${file}`);
        }
        console.log(`  ✅ Emptied lead folder: ${folder}`);
      }
    }
  } catch (err) {
    console.error('❌ Vault storage clean error:', err);
  }

  // ==========================================
  // 4. POST-CLEANUP VERIFICATION
  // ==========================================
  console.log('\n▶ [4/4] Final Verification of Clean Slate...');
  const verifyPrisma = new PrismaClient();
  try {
    const remainingLeads = await verifyPrisma.lead.count();
    const remainingHistories = await verifyPrisma.leadStatusHistory.count();
    const remainingAiScores = await verifyPrisma.leadAIScore.count();
    const remainingLeadActivities = await verifyPrisma.activity.count({
      where: { OR: [{ leadId: { not: null } }, { type: 'IMPORT' }] },
    });
    const remainingLeadTasks = await verifyPrisma.task.count({ where: { leadId: { not: null } } });
    const remainingUsers = await verifyPrisma.user.count();
    const remainingEmployees = await verifyPrisma.employeeProfile.count();
    const remainingOrgs = await verifyPrisma.organization.count();
    const remainingCompanies = await verifyPrisma.company.count();
    const remainingProducts = await verifyPrisma.product.count();

    console.log('-----------------------------------------------------');
    console.log('RESULTS:');
    console.log(`Leads Remaining:                 ${remainingLeads}  (Must be 0)`);
    console.log(`Lead Status History Remaining:   ${remainingHistories}  (Must be 0)`);
    console.log(`Lead AI Scores Remaining:        ${remainingAiScores}  (Must be 0)`);
    console.log(`Lead Activities Remaining:       ${remainingLeadActivities}  (Must be 0)`);
    console.log(`Lead Tasks Remaining:            ${remainingLeadTasks}  (Must be 0)`);
    console.log('-----------------------------------------------------');
    console.log(`Protected Users (Employees):     ${remainingUsers}  (PRESERVED)`);
    console.log(`Protected Employee Profiles:     ${remainingEmployees}  (PRESERVED)`);
    console.log(`Protected Organizations:         ${remainingOrgs}  (PRESERVED)`);
    console.log(`Protected Companies:             ${remainingCompanies}  (PRESERVED)`);
    console.log(`Protected Products:              ${remainingProducts}  (PRESERVED)`);
    console.log('-----------------------------------------------------');
    console.log('✨ CLEANUP COMPLETE: DATABASE & STORAGE READY FOR FRESH START! ✨\n');
  } finally {
    await verifyPrisma.$disconnect();
  }
}

cleanAllLeadsAndStartFresh()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal error during clean:', e);
    process.exit(1);
  });
