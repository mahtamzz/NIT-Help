import { SEED_IDS } from '@nit-help/microservice-common';
import {
  NotificationType,
  PrismaClient,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '../node_modules/.prisma/ops-client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Ops schema (notifications & analytics projections)...');

  const departments = [
    {
      departmentId: SEED_IDS.DEPARTMENTS.IT,
      name: 'مرکز فناوری اطلاعات و ارتباطات',
      code: 'IT',
      isActive: true,
    },
    {
      departmentId: SEED_IDS.DEPARTMENTS.EDU,
      name: 'معاونت آموزشی و تحصیلات تکمیلی',
      code: 'EDU',
      isActive: true,
    },
    {
      departmentId: SEED_IDS.DEPARTMENTS.FAC,
      name: 'اداره پشتیبانی، فنی و تأسیسات',
      code: 'FAC',
      isActive: true,
    },
  ];

  for (const d of departments) {
    await prisma.departmentAnalytics.upsert({
      where: { departmentId: d.departmentId },
      update: d,
      create: d,
    });
  }

  const users = [
    {
      userId: SEED_IDS.USERS.IT_MANAGER,
      fullName: 'دکتر رضا حسینی (مدیر فناوری اطلاعات)',
      email: 'it.manager@nit.ac.ir',
      role: UserRole.MANAGER,
      departmentId: SEED_IDS.DEPARTMENTS.IT,
      departmentName: 'مرکز فناوری اطلاعات و ارتباطات',
      isActive: true,
    },
    {
      userId: SEED_IDS.USERS.EDU_MANAGER,
      fullName: 'دکتر مریم صادقی (مدیر امور آموزشی)',
      email: 'edu.manager@nit.ac.ir',
      role: UserRole.MANAGER,
      departmentId: SEED_IDS.DEPARTMENTS.EDU,
      departmentName: 'معاونت آموزشی و تحصیلات تکمیلی',
      isActive: true,
    },
    {
      userId: SEED_IDS.USERS.FAC_MANAGER,
      fullName: 'مهندس علی کاظمی (مدیر تأسیسات)',
      email: 'facilities.manager@nit.ac.ir',
      role: UserRole.MANAGER,
      departmentId: SEED_IDS.DEPARTMENTS.FAC,
      departmentName: 'اداره پشتیبانی، فنی و تأسیسات',
      isActive: true,
    },
    {
      userId: SEED_IDS.USERS.IT_SPECIALIST,
      fullName: 'مهندس امیر قاسمی (کارشناس شبکه و سامانه‌ها)',
      email: 'it.specialist@nit.ac.ir',
      role: UserRole.SPECIALIST,
      departmentId: SEED_IDS.DEPARTMENTS.IT,
      departmentName: 'مرکز فناوری اطلاعات و ارتباطات',
      isActive: true,
    },
    {
      userId: SEED_IDS.USERS.EDU_SPECIALIST,
      fullName: 'سرکار خانم ناصری (کارشناس فارغ‌التحصیلان)',
      email: 'edu.specialist@nit.ac.ir',
      role: UserRole.SPECIALIST,
      departmentId: SEED_IDS.DEPARTMENTS.EDU,
      departmentName: 'معاونت آموزشی و تحصیلات تکمیلی',
      isActive: true,
    },
    {
      userId: SEED_IDS.USERS.FAC_SPECIALIST,
      fullName: 'آقای احمد مرادی (کارشناس تأسیسات و نگهداری)',
      email: 'fac.specialist@nit.ac.ir',
      role: UserRole.SPECIALIST,
      departmentId: SEED_IDS.DEPARTMENTS.FAC,
      departmentName: 'اداره پشتیبانی، فنی و تأسیسات',
      isActive: true,
    },
  ];

  for (const u of users) {
    await prisma.userAnalytics.upsert({
      where: { userId: u.userId },
      update: u,
      create: u,
    });
  }

  const now = new Date();
  const tickets = [
    {
      ticketId: SEED_IDS.TICKETS.T1,
      ticketNumber: 'NIT-20261107-1001',
      departmentId: SEED_IDS.DEPARTMENTS.IT,
      departmentName: 'مرکز فناوری اطلاعات و ارتباطات',
      serviceId: SEED_IDS.SERVICES.INTERNET,
      assignedToId: SEED_IDS.USERS.IT_SPECIALIST,
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.HIGH,
      createdAt: now,
      resolvedAt: null,
      closedAt: null,
      updatedAt: now,
    },
    {
      ticketId: SEED_IDS.TICKETS.T2,
      ticketNumber: 'NIT-20261107-1002',
      departmentId: SEED_IDS.DEPARTMENTS.EDU,
      departmentName: 'معاونت آموزشی و تحصیلات تکمیلی',
      serviceId: SEED_IDS.SERVICES.CERT,
      assignedToId: SEED_IDS.USERS.EDU_SPECIALIST,
      status: TicketStatus.RESOLVED,
      priority: TicketPriority.NORMAL,
      createdAt: now,
      resolvedAt: now,
      closedAt: null,
      updatedAt: now,
    },
    {
      ticketId: SEED_IDS.TICKETS.T3,
      ticketNumber: 'NIT-20261107-1003',
      departmentId: SEED_IDS.DEPARTMENTS.FAC,
      departmentName: 'اداره پشتیبانی، فنی و تأسیسات',
      serviceId: SEED_IDS.SERVICES.REPAIR,
      assignedToId: SEED_IDS.USERS.FAC_SPECIALIST,
      status: TicketStatus.NEW,
      priority: TicketPriority.NORMAL,
      createdAt: now,
      resolvedAt: null,
      closedAt: null,
      updatedAt: now,
    },
  ];

  for (const t of tickets) {
    await prisma.ticketAnalytics.upsert({
      where: { ticketId: t.ticketId },
      update: t,
      create: t,
    });
  }

  const existingNotifs = await prisma.notification.count();
  if (existingNotifs === 0) {
    await prisma.notification.createMany({
      data: [
        {
          recipientId: SEED_IDS.USERS.STUDENT,
          ticketId: SEED_IDS.TICKETS.T1,
          type: NotificationType.MESSAGE_RECEIVED,
          title: 'پاسخ جدید کارشناس',
          message: 'مهندس امیر قاسمی به تیکت NIT-20261107-1001 شما پاسخ داد.',
          isRead: false,
        },
        {
          recipientId: SEED_IDS.USERS.IT_SPECIALIST,
          ticketId: SEED_IDS.TICKETS.T1,
          type: NotificationType.TICKET_ASSIGNED,
          title: 'ارجاع تیکت جدید',
          message: 'تیکت NIT-20261107-1001 به شما محول گردید.',
          isRead: true,
        },
        {
          recipientId: SEED_IDS.USERS.STUDENT,
          ticketId: SEED_IDS.TICKETS.T2,
          type: NotificationType.TICKET_RESOLVED,
          title: 'تیکت حل شد',
          message: 'درخواست صدور گواهی اشتغال به تحصیل پاسخ داده شد.',
          isRead: true,
        },
      ],
    });
  }

  console.log('✅ Ops schema seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding Ops schema:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
