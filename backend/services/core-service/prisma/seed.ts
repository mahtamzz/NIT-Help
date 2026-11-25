import { SEED_IDS } from '@nit-help/microservice-common';
import {
  PrismaClient,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '../node_modules/.prisma/core-client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Core schema (user replicas, departments, services, tickets)...');

  const userReplicas = [
    {
      id: SEED_IDS.USERS.ADMIN,
      email: 'admin@nit.ac.ir',
      username: 'admin',
      fullName: 'مهندس محمد علوی (مدیر ارشد سامانه)',
      role: UserRole.ADMIN,
      departmentId: null,
    },
    {
      id: SEED_IDS.USERS.IT_MANAGER,
      email: 'it.manager@nit.ac.ir',
      username: 'it_manager',
      fullName: 'دکتر رضا حسینی (مدیر فناوری اطلاعات)',
      role: UserRole.MANAGER,
      departmentId: SEED_IDS.DEPARTMENTS.IT,
    },
    {
      id: SEED_IDS.USERS.EDU_MANAGER,
      email: 'edu.manager@nit.ac.ir',
      username: 'edu_manager',
      fullName: 'دکتر مریم صادقی (مدیر امور آموزشی)',
      role: UserRole.MANAGER,
      departmentId: SEED_IDS.DEPARTMENTS.EDU,
    },
    {
      id: SEED_IDS.USERS.FAC_MANAGER,
      email: 'facilities.manager@nit.ac.ir',
      username: 'fac_manager',
      fullName: 'مهندس علی کاظمی (مدیر تأسیسات)',
      role: UserRole.MANAGER,
      departmentId: SEED_IDS.DEPARTMENTS.FAC,
    },
    {
      id: SEED_IDS.USERS.IT_SPECIALIST,
      email: 'it.specialist@nit.ac.ir',
      username: 'it_spec',
      fullName: 'مهندس امیر قاسمی (کارشناس شبکه و سامانه‌ها)',
      role: UserRole.SPECIALIST,
      departmentId: SEED_IDS.DEPARTMENTS.IT,
    },
    {
      id: SEED_IDS.USERS.EDU_SPECIALIST,
      email: 'edu.specialist@nit.ac.ir',
      username: 'edu_spec',
      fullName: 'سرکار خانم ناصری (کارشناس فارغ‌التحصیلان)',
      role: UserRole.SPECIALIST,
      departmentId: SEED_IDS.DEPARTMENTS.EDU,
    },
    {
      id: SEED_IDS.USERS.FAC_SPECIALIST,
      email: 'fac.specialist@nit.ac.ir',
      username: 'fac_spec',
      fullName: 'آقای احمد مرادی (کارشناس تأسیسات و نگهداری)',
      role: UserRole.SPECIALIST,
      departmentId: SEED_IDS.DEPARTMENTS.FAC,
    },
    {
      id: SEED_IDS.USERS.STUDENT,
      email: 'student@nit.ac.ir',
      username: 'student',
      fullName: 'علی اکبری (دانشجوی مهندسی کامپیوتر)',
      role: UserRole.STUDENT,
      departmentId: null,
    },
    {
      id: SEED_IDS.USERS.FACULTY,
      email: 'faculty@nit.ac.ir',
      username: 'faculty',
      fullName: 'دکتر بهنام مرادی (عضو هیئت علمی دانشکده برق)',
      role: UserRole.FACULTY,
      departmentId: null,
    },
  ];

  for (const u of userReplicas) {
    await prisma.userReplica.upsert({
      where: { id: u.id },
      update: { ...u, isActive: true },
      create: { ...u, isActive: true },
    });
  }

  const itDept = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {
      name: 'مرکز فناوری اطلاعات و ارتباطات',
      managerId: SEED_IDS.USERS.IT_MANAGER,
    },
    create: {
      id: SEED_IDS.DEPARTMENTS.IT,
      name: 'مرکز فناوری اطلاعات و ارتباطات',
      code: 'IT',
      description: 'پشتیبانی شبکه، سامانه‌های جامع دانشگاهی، اکانت‌های کاربری و سرورها',
      managerId: SEED_IDS.USERS.IT_MANAGER,
      isActive: true,
    },
  });

  const eduDept = await prisma.department.upsert({
    where: { code: 'EDU' },
    update: {
      name: 'معاونت آموزشی و تحصیلات تکمیلی',
      managerId: SEED_IDS.USERS.EDU_MANAGER,
    },
    create: {
      id: SEED_IDS.DEPARTMENTS.EDU,
      name: 'معاونت آموزشی و تحصیلات تکمیلی',
      code: 'EDU',
      description: 'امور ثبت‌نام، فارغ‌التحصیلی، نظام وظیفه، انتخاب واحد و گواهی‌های آموزشی',
      managerId: SEED_IDS.USERS.EDU_MANAGER,
      isActive: true,
    },
  });

  const facDept = await prisma.department.upsert({
    where: { code: 'FAC' },
    update: {
      name: 'اداره پشتیبانی، فنی و تأسیسات',
      managerId: SEED_IDS.USERS.FAC_MANAGER,
    },
    create: {
      id: SEED_IDS.DEPARTMENTS.FAC,
      name: 'اداره پشتیبانی، فنی و تأسیسات',
      code: 'FAC',
      description: 'تعمیرات ابنیه و تجهیزات، روشنایی، سرمایش و گرمایش، و خدمات عمومی',
      managerId: SEED_IDS.USERS.FAC_MANAGER,
      isActive: true,
    },
  });

  const itCategory = await prisma.serviceCategory.upsert({
    where: { id: SEED_IDS.CATEGORIES.IT },
    update: {},
    create: {
      id: SEED_IDS.CATEGORIES.IT,
      name: 'خدمات فناوری اطلاعات و سامانه‌ها',
      description: 'امور مربوط به اینترنت، پست الکترونیک، سامانه‌های آموزشی و دسترسی‌های شبکه',
      icon: 'Network',
      displayOrder: 1,
      isActive: true,
    },
  });

  const eduCategory = await prisma.serviceCategory.upsert({
    where: { id: SEED_IDS.CATEGORIES.EDU },
    update: {},
    create: {
      id: SEED_IDS.CATEGORIES.EDU,
      name: 'خدمات آموزشی و تحصیلات تکمیلی',
      description: 'امور ثبت‌نام، انتخاب واحد، گواهی اشتغال به تحصیل، تسویه‌حساب و دانشنامه',
      icon: 'GraduationCap',
      displayOrder: 2,
      isActive: true,
    },
  });

  const facCategory = await prisma.serviceCategory.upsert({
    where: { id: SEED_IDS.CATEGORIES.FAC },
    update: {},
    create: {
      id: SEED_IDS.CATEGORIES.FAC,
      name: 'امور فنی، رفاهی و پشتیبانی دانشگاه',
      description: 'تعمیرات فضاها، خدمات رفاهی دانشجویی و اساتید، و تأسیسات دانشگاهی',
      icon: 'Wrench',
      displayOrder: 3,
      isActive: true,
    },
  });

  const internetService = await prisma.service.upsert({
    where: { id: SEED_IDS.SERVICES.INTERNET },
    update: {},
    create: {
      id: SEED_IDS.SERVICES.INTERNET,
      name: 'اتصال اینترنت، وای‌فای و VPN دانشگاه',
      description: 'رفع مشکلات اتصال، افزایش ترافیک، بازیابی رمز عبور هات‌اسپات و تنظیم کانکشن دانشگاه',
      categoryId: itCategory.id,
      departmentId: itDept.id,
      defaultPriority: TicketPriority.NORMAL,
      targetResolutionHours: 24,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { id: SEED_IDS.SERVICES.PORTAL },
    update: {},
    create: {
      id: SEED_IDS.SERVICES.PORTAL,
      name: 'پشتیبانی سامانه آموزش و پرتال دانشجویی',
      description: 'گزارش خطای ثبت‌نام، مشکلات ورود به سامانه، خطای نمایش نمرات و انتخاب واحد',
      categoryId: itCategory.id,
      departmentId: itDept.id,
      defaultPriority: TicketPriority.HIGH,
      targetResolutionHours: 12,
      isActive: true,
    },
  });

  const certService = await prisma.service.upsert({
    where: { id: SEED_IDS.SERVICES.CERT },
    update: {},
    create: {
      id: SEED_IDS.SERVICES.CERT,
      name: 'صدور گواهی اشتغال به تحصیل و معرفی‌نامه',
      description: 'صدور گواهی برای نظام وظیفه، بیمه، ادارات دولتی و سفارتخانه‌ها',
      categoryId: eduCategory.id,
      departmentId: eduDept.id,
      defaultPriority: TicketPriority.NORMAL,
      targetResolutionHours: 48,
      isActive: true,
    },
  });

  const repairService = await prisma.service.upsert({
    where: { id: SEED_IDS.SERVICES.REPAIR },
    update: {},
    create: {
      id: SEED_IDS.SERVICES.REPAIR,
      name: 'تعمیرات تأسیسات، روشنایی و تهویه کلاس‌ها',
      description: 'ثبت خرابی پروژکتور، سیستم‌های سرمایش/گرمایش، برق و روشنایی دانشکده‌ها و آزمایشگاه‌ها',
      categoryId: facCategory.id,
      departmentId: facDept.id,
      defaultPriority: TicketPriority.LOW,
      targetResolutionHours: 72,
      isActive: true,
    },
  });

  const t1 = await prisma.ticket.upsert({
    where: { ticketNumber: 'NIT-20261107-1001' },
    update: {},
    create: {
      id: SEED_IDS.TICKETS.T1,
      ticketNumber: 'NIT-20261107-1001',
      subject: 'عدم اتصال به اینترنت پرسرعت در خوابگاه شهید بهشتی',
      description:
        'با سلام، از دیروز اتصال وای‌فای خوابگاه بلوک ۳ به طور مکرر قطع می‌شود و امکان اتصال به منابع کتابخانه دانشگاه وجود ندارد. لطفا بررسی فرمایید.',
      requesterId: SEED_IDS.USERS.STUDENT,
      serviceId: internetService.id,
      departmentId: itDept.id,
      assignedToId: SEED_IDS.USERS.IT_SPECIALIST,
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.HIGH,
    },
  });

  const existingT1Messages = await prisma.ticketMessage.count({ where: { ticketId: t1.id } });
  if (existingT1Messages === 0) {
    await prisma.ticketMessage.createMany({
      data: [
        {
          ticketId: t1.id,
          authorId: SEED_IDS.USERS.STUDENT,
          content:
            'با سلام، از دیروز اتصال وای‌فای خوابگاه بلوک ۳ به طور مکرر قطع می‌شود و امکان اتصال به منابع کتابخانه دانشگاه وجود ندارد. لطفا بررسی فرمایید.',
          isInternal: false,
        },
        {
          ticketId: t1.id,
          authorId: SEED_IDS.USERS.IT_SPECIALIST,
          content:
            'سلام و احترام؛ روتر اکسس پوینت طبقه دوم خوابگاه ریستارت شد. لطفا MAC آدرس کارت شبکه لپ‌تاپ خود را جهت اختصاص IP استاتیک ارسال کنید.',
          isInternal: false,
        },
        {
          ticketId: t1.id,
          authorId: SEED_IDS.USERS.IT_SPECIALIST,
          content:
            'یادداشت داخلی کارشناس: سوئیچ سیسکو طبقه ۲ دارای نوسان پورت است. به آقای مهندس مرادی برای بررسی کابل‌کشی اطلاع داده شود.',
          isInternal: true,
        },
      ],
    });
  }

  const existingT1History = await prisma.ticketHistory.count({ where: { ticketId: t1.id } });
  if (existingT1History === 0) {
    await prisma.ticketHistory.createMany({
      data: [
        {
          ticketId: t1.id,
          actorId: SEED_IDS.USERS.STUDENT,
          action: 'TICKET_CREATED',
          newValue: TicketStatus.NEW,
          note: 'تیکت توسط دانشجو ایجاد شد',
        },
        {
          ticketId: t1.id,
          actorId: SEED_IDS.USERS.IT_MANAGER,
          action: 'TICKET_ASSIGNED',
          oldValue: 'بدون تخصیص',
          newValue: 'مهندس امیر قاسمی (کارشناس شبکه و سامانه‌ها)',
          note: 'تیکت به کارشناس شبکه تخصیص داده شد',
        },
        {
          ticketId: t1.id,
          actorId: SEED_IDS.USERS.IT_SPECIALIST,
          action: 'STATUS_CHANGED',
          oldValue: TicketStatus.ASSIGNED,
          newValue: TicketStatus.IN_PROGRESS,
          note: 'تغییر وضعیت به در حال بررسی',
        },
      ],
    });
  }

  const t2 = await prisma.ticket.upsert({
    where: { ticketNumber: 'NIT-20261107-1002' },
    update: {},
    create: {
      id: SEED_IDS.TICKETS.T2,
      ticketNumber: 'NIT-20261107-1002',
      subject: 'درخواست صدور گواهی اشتغال به تحصیل جهت ارائه به نظام وظیفه',
      description:
        'احتراما اینجانب نیازمند گواهی اشتغال به تحصیل رسمی با ذکر تعداد واحدهای گذرانده شده جهت تمدید معافیت تحصیلی هستم.',
      requesterId: SEED_IDS.USERS.STUDENT,
      serviceId: certService.id,
      departmentId: eduDept.id,
      assignedToId: SEED_IDS.USERS.EDU_SPECIALIST,
      status: TicketStatus.RESOLVED,
      priority: TicketPriority.NORMAL,
      resolvedAt: new Date(),
    },
  });

  await prisma.ticketFeedback.upsert({
    where: { ticketId: t2.id },
    update: {},
    create: {
      ticketId: t2.id,
      requesterId: SEED_IDS.USERS.STUDENT,
      rating: 5,
      comment: 'بسیار سریع و با دقت بالا گواهی صادر و ارسال گردید. با تشکر از اداره آموزش.',
    },
  });

  await prisma.ticket.upsert({
    where: { ticketNumber: 'NIT-20261107-1003' },
    update: {},
    create: {
      id: SEED_IDS.TICKETS.T3,
      ticketNumber: 'NIT-20261107-1003',
      subject: 'نقص فنی ویدئو پروژکتور کلاس ۱۰۲ دانشکده برق',
      description:
        'تصویر ویدئو پروژکتور کلاس ۱۰۲ چشمک می‌زند و پس از چند دقیقه خاموش می‌شود. لطفا پیش از شروع کلاس‌های فردا بررسی فرمایید.',
      requesterId: SEED_IDS.USERS.FACULTY,
      serviceId: repairService.id,
      departmentId: facDept.id,
      assignedToId: SEED_IDS.USERS.FAC_SPECIALIST,
      status: TicketStatus.NEW,
      priority: TicketPriority.NORMAL,
    },
  });

  console.log('✅ Core schema seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding Core schema:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
