import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const ENCRYPTION_KEY_HEX = process.env.AADHAAR_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function encryptAadhaar(plain: string): string {
  try {
    const key = Buffer.from(ENCRYPTION_KEY_HEX.slice(0, 64), 'hex');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let enc = cipher.update(plain, 'utf8', 'hex');
    enc += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${tag}:${enc}`;
  } catch {
    return `hash:${crypto.createHash('sha256').update(plain).digest('hex')}`;
  }
}

async function main() {
  console.log('🌾 Seeding Kisan Setu database...');
  const isReset = process.argv.includes('--reset');

  if (isReset) {
    console.log('🧹 Resetting existing demo data...');
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.procurement.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.queue.deleteMany();
    await prisma.slot.deleteMany();
    await prisma.officer.deleteMany();
    await prisma.farmer.deleteMany();
    await prisma.procurementCentre.deleteMany();
  }

  const today = new Date().toISOString().split('T')[0];

  // 1. Seed Procurement Centres
  const centreGuntur = await prisma.procurementCentre.upsert({
    where: { id: 'centre-guntur-01' },
    update: {
      name: 'Guntur Agricultural Procurement Centre',
      latitude: 16.3067,
      longitude: 80.4365,
      phoneNumber: '+91 863 2234567',
      contactOfficerName: 'Rajesh Kumar',
      contactOfficerNumber: '+91 98765 43210',
    },
    create: {
      id: 'centre-guntur-01',
      name: 'Guntur Agricultural Procurement Centre',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      address: 'Market Yard Road, Near APMC Complex, Guntur - 522004',
      latitude: 16.3067,
      longitude: 80.4365,
      phoneNumber: '+91 863 2234567',
      contactOfficerName: 'Rajesh Kumar',
      contactOfficerNumber: '+91 98765 43210',
      openingTime: '09:00',
      closingTime: '17:00',
      active: true,
    },
  });

  const centreTenali = await prisma.procurementCentre.upsert({
    where: { id: 'centre-tenali-02' },
    update: {
      name: 'Tenali Procurement Centre',
      latitude: 16.2430,
      longitude: 80.6400,
      phoneNumber: '+91 8644 221144',
      contactOfficerName: 'Suresh Reddy',
      contactOfficerNumber: '+91 97654 32109',
    },
    create: {
      id: 'centre-tenali-02',
      name: 'Tenali Procurement Centre',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      address: 'Station Road, Tenali Rural, Guntur - 522201',
      latitude: 16.2430,
      longitude: 80.6400,
      phoneNumber: '+91 8644 221144',
      contactOfficerName: 'Suresh Reddy',
      contactOfficerNumber: '+91 97654 32109',
      openingTime: '09:00',
      closingTime: '17:00',
      active: true,
    },
  });

  const centreMangalagiri = await prisma.procurementCentre.upsert({
    where: { id: 'centre-mangalagiri-03' },
    update: {
      name: 'Mangalagiri Procurement Centre',
      latitude: 16.4347,
      longitude: 80.5583,
      phoneNumber: '+91 8645 233211',
      contactOfficerName: 'Anil Kumar',
      contactOfficerNumber: '+91 96543 21098',
    },
    create: {
      id: 'centre-mangalagiri-03',
      name: 'Mangalagiri Procurement Centre',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      address: 'Bypass Road, Mangalagiri - 522503',
      latitude: 16.4347,
      longitude: 80.5583,
      phoneNumber: '+91 8645 233211',
      contactOfficerName: 'Anil Kumar',
      contactOfficerNumber: '+91 96543 21098',
      openingTime: '09:00',
      closingTime: '17:00',
      active: true,
    },
  });

  const centreVijayawada = await prisma.procurementCentre.upsert({
    where: { id: 'centre-vijayawada-04' },
    update: {
      name: 'Vijayawada Agricultural Procurement Centre',
      latitude: 16.5062,
      longitude: 80.6480,
      phoneNumber: '+91 866 2419876',
      contactOfficerName: 'Ravi Teja',
      contactOfficerNumber: '+91 95432 10987',
    },
    create: {
      id: 'centre-vijayawada-04',
      name: 'Vijayawada Agricultural Procurement Centre',
      district: 'NTR District',
      state: 'Andhra Pradesh',
      address: 'Gollapudi Market Yard, Vijayawada - 521225',
      latitude: 16.5062,
      longitude: 80.6480,
      phoneNumber: '+91 866 2419876',
      contactOfficerName: 'Ravi Teja',
      contactOfficerNumber: '+91 95432 10987',
      openingTime: '09:00',
      closingTime: '17:00',
      active: true,
    },
  });

  // 2. Seed Officers with bcrypt hashes
  const passwordHash = await bcrypt.hash('Kisan@123', 10);

  await prisma.officer.upsert({
    where: { username: 'guntur_officer' },
    update: { passwordHash, centreId: centreGuntur.id },
    create: {
      id: 'officer-guntur-01',
      username: 'guntur_officer',
      passwordHash,
      fullName: 'Venkata Satyanarayana (Procurement Superintendent)',
      centreId: centreGuntur.id,
      role: 'OFFICER',
      active: true,
    },
  });

  await prisma.officer.upsert({
    where: { username: 'tenali_officer' },
    update: { passwordHash, centreId: centreTenali.id },
    create: {
      id: 'officer-tenali-02',
      username: 'tenali_officer',
      passwordHash,
      fullName: 'K. Subba Rao (Procurement Officer)',
      centreId: centreTenali.id,
      role: 'OFFICER',
      active: true,
    },
  });

  await prisma.officer.upsert({
    where: { username: 'mangalagiri_officer' },
    update: { passwordHash, centreId: centreMangalagiri.id },
    create: {
      id: 'officer-mangalagiri-03',
      username: 'mangalagiri_officer',
      passwordHash,
      fullName: 'Ch. Madhusudhan (Quality Inspector & Officer)',
      centreId: centreMangalagiri.id,
      role: 'OFFICER',
      active: true,
    },
  });

  // 3. Seed Slots for Guntur Today (with different loads to demo Smart Recommendation)
  const slot1 = await prisma.slot.upsert({
    where: {
      centreId_date_startTime: {
        centreId: centreGuntur.id,
        date: today,
        startTime: '09:00',
      },
    },
    update: { bookedCount: 10 }, // Full
    create: {
      id: 'slot-guntur-09-10',
      centreId: centreGuntur.id,
      date: today,
      startTime: '09:00',
      endTime: '10:00',
      capacity: 10,
      bookedCount: 10,
    },
  });

  const slot2 = await prisma.slot.upsert({
    where: {
      centreId_date_startTime: {
        centreId: centreGuntur.id,
        date: today,
        startTime: '10:00',
      },
    },
    update: { bookedCount: 7 }, // Almost full
    create: {
      id: 'slot-guntur-10-11',
      centreId: centreGuntur.id,
      date: today,
      startTime: '10:00',
      endTime: '11:00',
      capacity: 10,
      bookedCount: 7,
    },
  });

  const slot3 = await prisma.slot.upsert({
    where: {
      centreId_date_startTime: {
        centreId: centreGuntur.id,
        date: today,
        startTime: '11:00',
      },
    },
    update: { bookedCount: 5 },
    create: {
      id: 'slot-guntur-11-12',
      centreId: centreGuntur.id,
      date: today,
      startTime: '11:00',
      endTime: '12:00',
      capacity: 10,
      bookedCount: 5,
    },
  });

  // Low congestion slot (Smart recommendation candidate)
  const slot4 = await prisma.slot.upsert({
    where: {
      centreId_date_startTime: {
        centreId: centreGuntur.id,
        date: today,
        startTime: '14:00',
      },
    },
    update: { bookedCount: 2 },
    create: {
      id: 'slot-guntur-14-15',
      centreId: centreGuntur.id,
      date: today,
      startTime: '14:00',
      endTime: '15:00',
      capacity: 10,
      bookedCount: 2,
    },
  });

  const slot5 = await prisma.slot.upsert({
    where: {
      centreId_date_startTime: {
        centreId: centreGuntur.id,
        date: today,
        startTime: '15:00',
      },
    },
    update: { bookedCount: 1 },
    create: {
      id: 'slot-guntur-15-16',
      centreId: centreGuntur.id,
      date: today,
      startTime: '15:00',
      endTime: '16:00',
      capacity: 10,
      bookedCount: 1,
    },
  });

  // 4. Seed Demo Farmer: Ramesh Kumar (9876543210)
  const demoFarmer = await prisma.farmer.upsert({
    where: { mobileNumber: '9876543210' },
    update: {
      fullName: 'Ramesh Kumar',
      village: 'Guntur Rural',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      preferredLanguage: 'en',
      centreId: centreGuntur.id,
    },
    create: {
      id: 'farmer-demo-ramesh',
      fullName: 'Ramesh Kumar',
      mobileNumber: '9876543210',
      aadhaarEncrypted: encryptAadhaar('123456789012'),
      aadhaarLast4: '9012',
      preferredLanguage: 'en',
      village: 'Guntur Rural',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      centreId: centreGuntur.id,
    },
  });

  // 5. Seed Additional Farmers to simulate Queue & Workflow states
  const farmerRavi = await prisma.farmer.upsert({
    where: { mobileNumber: '9876543211' },
    update: {},
    create: {
      id: 'farmer-ravi-01',
      fullName: 'Ravi Kumar',
      mobileNumber: '9876543211',
      aadhaarEncrypted: encryptAadhaar('987654321001'),
      aadhaarLast4: '1001',
      village: 'Chebrolu',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      centreId: centreGuntur.id,
    },
  });

  const farmerSuresh = await prisma.farmer.upsert({
    where: { mobileNumber: '9876543212' },
    update: {},
    create: {
      id: 'farmer-suresh-02',
      fullName: 'Suresh Kumar',
      mobileNumber: '9876543212',
      aadhaarEncrypted: encryptAadhaar('987654321002'),
      aadhaarLast4: '1002',
      village: 'Narakodur',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      centreId: centreGuntur.id,
    },
  });

  const farmerLakshmi = await prisma.farmer.upsert({
    where: { mobileNumber: '9876543213' },
    update: {},
    create: {
      id: 'farmer-lakshmi-03',
      fullName: 'Lakshmi Devi',
      mobileNumber: '9876543213',
      aadhaarEncrypted: encryptAadhaar('987654321003'),
      aadhaarLast4: '1003',
      village: 'Pedakakani',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      centreId: centreGuntur.id,
    },
  });

  const farmerVenkat = await prisma.farmer.upsert({
    where: { mobileNumber: '9876543214' },
    update: {},
    create: {
      id: 'farmer-venkat-04',
      fullName: 'Venkat Rao',
      mobileNumber: '9876543214',
      aadhaarEncrypted: encryptAadhaar('987654321004'),
      aadhaarLast4: '1004',
      village: 'Prathipadu',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      centreId: centreGuntur.id,
    },
  });

  // 6. Seed Queue for Guntur Today (Currently Serving A-036)
  await prisma.queue.upsert({
    where: {
      centreId_date: {
        centreId: centreGuntur.id,
        date: today,
      },
    },
    update: { currentlyServing: 'A-036' },
    create: {
      id: 'queue-guntur-today',
      centreId: centreGuntur.id,
      date: today,
      currentlyServing: 'A-036',
    },
  });

  // 7. Seed Bookings in sequence (A-036 to A-043)
  // A-036: Serving currently (Ravi Kumar)
  const bookingRavi = await prisma.booking.upsert({
    where: { bookingReference: 'KS-26032-1036' },
    update: {},
    create: {
      id: 'booking-ravi-036',
      farmerId: farmerRavi.id,
      centreId: centreGuntur.id,
      slotId: slot2.id,
      bookingReference: 'KS-26032-1036',
      tokenNumber: 'A-036',
      cropType: 'Paddy',
      expectedQuantity: 18,
      quantityUnit: 'q',
      originalQuantity: 18,
      expectedQuantityKg: 1800,
      status: 'ARRIVED',
    },
  });

  const procRavi = await prisma.procurement.upsert({
    where: { bookingId: bookingRavi.id },
    update: {},
    create: {
      id: 'proc-ravi-036',
      bookingId: bookingRavi.id,
      farmerId: farmerRavi.id,
      cropType: 'Paddy',
      expectedQuantity: 18,
      quantityUnit: 'q',
      originalQuantity: 18,
      expectedQuantityKg: 1800,
      status: 'PENDING_INSPECTION',
    },
  });

  // A-037: Suresh (Inspected / Approved -> Pending Payment)
  const bookingSuresh = await prisma.booking.upsert({
    where: { bookingReference: 'KS-26032-1037' },
    update: {},
    create: {
      id: 'booking-suresh-037',
      farmerId: farmerSuresh.id,
      centreId: centreGuntur.id,
      slotId: slot2.id,
      bookingReference: 'KS-26032-1037',
      tokenNumber: 'A-037',
      cropType: 'Paddy',
      expectedQuantity: 30,
      quantityUnit: 'q',
      originalQuantity: 30,
      expectedQuantityKg: 3000,
      status: 'COMPLETED',
    },
  });

  const procSuresh = await prisma.procurement.upsert({
    where: { bookingId: bookingSuresh.id },
    update: {},
    create: {
      id: 'proc-suresh-037',
      bookingId: bookingSuresh.id,
      farmerId: farmerSuresh.id,
      cropType: 'Paddy',
      expectedQuantity: 30,
      quantityUnit: 'q',
      originalQuantity: 30,
      expectedQuantityKg: 3000,
      actualReceivedQuantityKg: 3000,
      acceptedQuantityKg: 2950,
      rejectedQuantityKg: 50,
      acceptedQuantity: 29.5,
      qualityGrade: 'Grade A',
      inspectionDecision: 'PARTIALLY_ACCEPTED',
      rejectionReason: 'Foreign matter / impurities',
      officerRemarks: 'Minor chaff removed',
      ratePerQuintal: 2300,
      totalAmount: 67850,
      status: 'APPROVED',
      inspectedAt: new Date(),
      approvedAt: new Date(),
    },
  });

  await prisma.payment.upsert({
    where: { procurementId: procSuresh.id },
    update: {},
    create: {
      id: 'pay-suresh-037',
      procurementId: procSuresh.id,
      farmerId: farmerSuresh.id,
      amount: 67850,
      status: 'PENDING',
    },
  });

  // A-038: Lakshmi (Maize -> Processing Payment)
  const bookingLakshmi = await prisma.booking.upsert({
    where: { bookingReference: 'KS-26032-1038' },
    update: {},
    create: {
      id: 'booking-lakshmi-038',
      farmerId: farmerLakshmi.id,
      centreId: centreGuntur.id,
      slotId: slot2.id,
      bookingReference: 'KS-26032-1038',
      tokenNumber: 'A-038',
      cropType: 'Maize',
      expectedQuantity: 22,
      quantityUnit: 'q',
      originalQuantity: 22,
      expectedQuantityKg: 2200,
      status: 'COMPLETED',
    },
  });

  const procLakshmi = await prisma.procurement.upsert({
    where: { bookingId: bookingLakshmi.id },
    update: {},
    create: {
      id: 'proc-lakshmi-038',
      bookingId: bookingLakshmi.id,
      farmerId: farmerLakshmi.id,
      cropType: 'Maize',
      expectedQuantity: 22,
      quantityUnit: 'q',
      originalQuantity: 22,
      expectedQuantityKg: 2200,
      actualReceivedQuantityKg: 2200,
      acceptedQuantityKg: 2200,
      rejectedQuantityKg: 0,
      acceptedQuantity: 22,
      qualityGrade: 'Grade A',
      inspectionDecision: 'FULLY_ACCEPTED',
      ratePerQuintal: 2150,
      totalAmount: 47300,
      status: 'APPROVED',
      inspectedAt: new Date(),
      approvedAt: new Date(),
    },
  });

  await prisma.payment.upsert({
    where: { procurementId: procLakshmi.id },
    update: {},
    create: {
      id: 'pay-lakshmi-038',
      procurementId: procLakshmi.id,
      farmerId: farmerLakshmi.id,
      amount: 47300,
      status: 'PROCESSING',
      processingAt: new Date(),
    },
  });

  // A-039: Venkat (Cotton -> Paid with Transaction ID)
  const bookingVenkat = await prisma.booking.upsert({
    where: { bookingReference: 'KS-26032-1039' },
    update: {},
    create: {
      id: 'booking-venkat-039',
      farmerId: farmerVenkat.id,
      centreId: centreGuntur.id,
      slotId: slot2.id,
      bookingReference: 'KS-26032-1039',
      tokenNumber: 'A-039',
      cropType: 'Cotton',
      expectedQuantity: 15,
      quantityUnit: 'q',
      originalQuantity: 15,
      expectedQuantityKg: 1500,
      status: 'COMPLETED',
    },
  });

  const procVenkat = await prisma.procurement.upsert({
    where: { bookingId: bookingVenkat.id },
    update: {},
    create: {
      id: 'proc-venkat-039',
      bookingId: bookingVenkat.id,
      farmerId: farmerVenkat.id,
      cropType: 'Cotton',
      expectedQuantity: 15,
      quantityUnit: 'q',
      originalQuantity: 15,
      expectedQuantityKg: 1500,
      actualReceivedQuantityKg: 1500,
      acceptedQuantityKg: 1480,
      rejectedQuantityKg: 20,
      acceptedQuantity: 14.8,
      qualityGrade: 'Grade A',
      inspectionDecision: 'PARTIALLY_ACCEPTED',
      rejectionReason: 'Excess moisture',
      ratePerQuintal: 7120,
      totalAmount: 105376,
      status: 'APPROVED',
      inspectedAt: new Date(),
      approvedAt: new Date(),
    },
  });

  await prisma.payment.upsert({
    where: { procurementId: procVenkat.id },
    update: {},
    create: {
      id: 'pay-venkat-039',
      procurementId: procVenkat.id,
      farmerId: farmerVenkat.id,
      amount: 105376,
      status: 'PAID',
      transactionReference: 'KS-PAY-2026-58491',
      paidAt: new Date(),
    },
  });

  // A-042: DEMO FARMER RAMESH KUMAR (Paddy 25 Q, Token A-042, 6 ahead)
  const bookingRamesh = await prisma.booking.upsert({
    where: { bookingReference: 'KS-26032-1847' },
    update: {
      status: 'BOOKED',
      tokenNumber: 'A-042',
    },
    create: {
      id: 'booking-ramesh-042',
      farmerId: demoFarmer.id,
      centreId: centreGuntur.id,
      slotId: slot2.id,
      bookingReference: 'KS-26032-1847',
      tokenNumber: 'A-042',
      cropType: 'Paddy',
      expectedQuantity: 25,
      quantityUnit: 'q',
      originalQuantity: 25,
      expectedQuantityKg: 2500,
      status: 'BOOKED',
    },
  });

  await prisma.procurement.upsert({
    where: { bookingId: bookingRamesh.id },
    update: { status: 'PENDING_INSPECTION' },
    create: {
      id: 'proc-ramesh-042',
      bookingId: bookingRamesh.id,
      farmerId: demoFarmer.id,
      cropType: 'Paddy',
      expectedQuantity: 25,
      quantityUnit: 'q',
      originalQuantity: 25,
      expectedQuantityKg: 2500,
      status: 'PENDING_INSPECTION',
    },
  });

  // Seed initial notification for Ramesh
  await prisma.notification.upsert({
    where: { id: 'notif-ramesh-01' },
    update: {},
    create: {
      id: 'notif-ramesh-01',
      farmerId: demoFarmer.id,
      type: 'SLOT_CONFIRMED',
      title: 'Slot Confirmed: Token A-042',
      message: 'Your procurement slot has been booked for Paddy (25 Q) at Guntur Agricultural Procurement Centre. Token: A-042.',
    },
  });

  // Seed initial audit log
  await prisma.auditLog.create({
    data: {
      officerId: 'officer-guntur-01',
      action: 'SYSTEM_SEED',
      entityType: 'System',
      entityId: 'seed-01',
      details: 'Demo environment initialized with sample centres, queue state A-036, and demo records.',
      ipAddress: '127.0.0.1',
    },
  });

  console.log('✅ Kisan Setu database seeding completed successfully!');
  console.log('📋 Demo Credentials:');
  console.log('   👨‍🌾 Farmer Mobile: 9876543210 (Demo OTP: 123456) -> Ramesh Kumar (Token A-042)');
  console.log('   👮 Officer Username: guntur_officer | Password: Kisan@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
