import { PrismaClient, UserRole, TicketStatus, TicketPriority, ObjectionStatus, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for NIT-Help...');

  // Hash passwords
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin@123456', saltRounds);
  const managerPasswordHash = await bcrypt.hash('Manager@123456', saltRounds);
  const specialistPasswordHash = await bcrypt.hash('Specialist@123456', saltRounds);
  const studentPasswordHash = await bcrypt.hash('Student@123456', saltRounds);
  const facultyPasswordHash = await bcrypt.hash('Faculty@123456', saltRounds);

  // 1. Create or upsert Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nit.ac.ir' },
    update: {
      passwordHash: adminPasswordHash,
      fullName: 'مهندس محمد علوی (مدیر ارشد سامانه)',
      role: UserRole.ADMIN,
    },
    create: {
      email: 'admin@nit.ac.ir',
      username: 'admin',
      fullName: 'مهندس محمد علوی (مدیر ارشد سامانه)',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  // 2. Create Departments
  const itDept = await prisma.department.upsert({
    where: { code: 'IT' },
    update: { name: 'مرکز فناوری اطلاعات و ارتباطات' },
    create: {
      name: 'مرکز فناوری اطلاعات و ارتباطات',
      code: 'IT',
      description: 'پشتیبانی شبکه، سامانه‌های جامع دانشگاهی، اکانت‌های کاربری و سرورها',
      isActive: true,
    },
  });

  const eduDept = await prisma.department.upsert({
    where: { code: 'EDU' },
    update: { name: 'معاونت آموزشی و تحصیلات تکمیلی' },
    create: {
      name: 'معاونت آموزشی و تحصیلات تکمیلی',
      code: 'EDU',
      description: 'امور ثبت‌نام، فارغ‌التحصیلی، نظام وظیفه، انتخاب واحد و گواهی‌های آموزشی',
      isActive: true,
    },
  });

  const facDept = await prisma.department.upsert({
    where: { code: 'FAC' },
    update: { name: 'اداره پشتیبانی، فنی و تأسیسات' },
    create: {
      name: 'اداره پشتیبانی، فنی و تأسیسات',
      code: 'FAC',
      description: 'تعمیرات ابنیه و تجهیزات، روشنایی، سرمایش و گرمایش، و خدمات عمومی',
      isActive: true,
    },
  });

  // 3. Create Managers
  const itManager = await prisma.user.upsert({
    where: { email: 'it.manager@nit.ac.ir' },
    update: {
      passwordHash: managerPasswordHash,
      departmentId: itDept.id,
      role: UserRole.MANAGER,
    },
    create: {
      email: 'it.manager@nit.ac.ir',
      username: 'it_manager',
      fullName: 'دکتر رضا حسینی (مدیر فناوری اطلاعات)',
      passwordHash: managerPasswordHash,
      role: UserRole.MANAGER,
      departmentId: itDept.id,
      isActive: true,
    },
  });

  const eduManager = await prisma.user.upsert({
    where: { email: 'edu.manager@nit.ac.ir' },
    update: {
      passwordHash: managerPasswordHash,
      departmentId: eduDept.id,
      role: UserRole.MANAGER,
    },
    create: {
      email: 'edu.manager@nit.ac.ir',
      username: 'edu_manager',
      fullName: 'دکتر مریم صادقی (مدیر امور آموزشی)',
      passwordHash: managerPasswordHash,
      role: UserRole.MANAGER,
      departmentId: eduDept.id,
      isActive: true,
    },
  });

  const facManager = await prisma.user.upsert({
    where: { email: 'facilities.manager@nit.ac.ir' },
    update: {
      passwordHash: managerPasswordHash,
      departmentId: facDept.id,
      role: UserRole.MANAGER,
    },
    create: {
      email: 'facilities.manager@nit.ac.ir',
      username: 'fac_manager',
      fullName: 'مهندس علی کاظمی (مدیر تأسیسات)',
      passwordHash: managerPasswordHash,
      role: UserRole.MANAGER,
      departmentId: facDept.id,
      isActive: true,
    },
  });

  // Link managers to depts
  await prisma.department.update({ where: { id: itDept.id }, data: { managerId: itManager.id } });
  await prisma.department.update({ where: { id: eduDept.id }, data: { managerId: eduManager.id } });
  await prisma.department.update({ where: { id: facDept.id }, data: { managerId: facManager.id } });

  // 4. Create Specialists
  const itSpecialist = await prisma.user.upsert({
    where: { email: 'it.specialist@nit.ac.ir' },
    update: {
      passwordHash: specialistPasswordHash,
      departmentId: itDept.id,
      role: UserRole.SPECIALIST,
    },
    create: {
      email: 'it.specialist@nit.ac.ir',
      username: 'it_spec',
      fullName: 'مهندس امیر قاسمی (کارشناس شبکه و سامانه‌ها)',
      passwordHash: specialistPasswordHash,
      role: UserRole.SPECIALIST,
      departmentId: itDept.id,
      isActive: true,
    },
  });

  const eduSpecialist = await prisma.user.upsert({
    where: { email: 'edu.specialist@nit.ac.ir' },
    update: {
      passwordHash: specialistPasswordHash,
      departmentId: eduDept.id,
      role: UserRole.SPECIALIST,
    },
    create: {
      email: 'edu.specialist@nit.ac.ir',
      username: 'edu_spec',
      fullName: 'سرکار خانم ناصری (کارشناس فارغ‌التحصیلان)',
      passwordHash: specialistPasswordHash,
      role: UserRole.SPECIALIST,
      departmentId: eduDept.id,
      isActive: true,
    },
  });

  const facSpecialist = await prisma.user.upsert({
    where: { email: 'fac.specialist@nit.ac.ir' },
    update: {
      passwordHash: specialistPasswordHash,
      departmentId: facDept.id,
      role: UserRole.SPECIALIST,
    },
    create: {
      email: 'fac.specialist@nit.ac.ir',
      username: 'fac_spec',
      fullName: 'آقای احمد مرادی (کارشناس تأسیسات و نگهداری)',
      passwordHash: specialistPasswordHash,
      role: UserRole.SPECIALIST,
      departmentId: facDept.id,
      isActive: true,
    },
  });

  // 5. Create Requesters (Student & Faculty)
  const student = await prisma.user.upsert({
    where: { email: 'student@nit.ac.ir' },
    update: {
      passwordHash: studentPasswordHash,
      role: UserRole.STUDENT,
    },
    create: {
      email: 'student@nit.ac.ir',
      username: 'student',
      fullName: 'علی اکبری (دانشجوی مهندسی کامپیوتر)',
      passwordHash: studentPasswordHash,
      role: UserRole.STUDENT,
      isActive: true,
    },
  });

  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@nit.ac.ir' },
    update: {
      passwordHash: facultyPasswordHash,
      role: UserRole.FACULTY,
    },
    create: {
      email: 'faculty@nit.ac.ir',
      username: 'faculty',
      fullName: 'دکتر بهنام مرادی (عضو هیئت علمی دانشکده برق)',
      passwordHash: facultyPasswordHash,
      role: UserRole.FACULTY,
      isActive: true,
    },
  });

  // 6. Service Categories
  const itCategory = await prisma.serviceCategory.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'خدمات فناوری اطلاعات و سامانه‌ها',
      description: 'امور مربوط به اینترنت، پست الکترونیک، سامانه‌های آموزشی و دسترسی‌های شبکه',
      icon: 'Network',
      displayOrder: 1,
      isActive: true,
    },
  });

  const eduCategory = await prisma.serviceCategory.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'خدمات آموزشی و تحصیلات تکمیلی',
      description: 'امور ثبت‌نام، انتخاب واحد، گواهی اشتغال به تحصیل، تسویه‌حساب و دانشنامه',
      icon: 'GraduationCap',
      displayOrder: 2,
      isActive: true,
    },
  });

  const facCategory = await prisma.serviceCategory.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'امور فنی، رفاهی و پشتیبانی دانشگاه',
      description: 'تعمیرات فضاها، خدمات رفاهی دانشجویی و اساتید، و تأسیسات دانشگاهی',
      icon: 'Wrench',
      displayOrder: 3,
      isActive: true,
    },
  });

  // 7. Services
  const internetService = await prisma.service.upsert({
    where: { id: '10000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '10000000-0000-0000-0000-000000000001',
      name: 'اتصال اینترنت، وای‌فای و VPN دانشگاه',
      description: 'رفع مشکلات اتصال، افزایش ترافیک، بازیابی رمز عبور هات‌اسپات و تنظیم کانکشن دانشگاه',
      categoryId: itCategory.id,
      departmentId: itDept.id,
      defaultPriority: TicketPriority.NORMAL,
      targetResolutionHours: 24,
      isActive: true,
    },
  });

  const portalService = await prisma.service.upsert({
    where: { id: '10000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '10000000-0000-0000-0000-000000000002',
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
    where: { id: '10000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '10000000-0000-0000-0000-000000000003',
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
    where: { id: '10000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '10000000-0000-0000-0000-000000000004',
      name: 'تعمیرات تأسیسات، روشنایی و تهویه کلاس‌ها',
      description: 'ثبت خرابی پروژکتور، سیستم‌های سرمایش/گرمایش، برق و روشنایی دانشکده‌ها و آزمایشگاه‌ها',
      categoryId: facCategory.id,
      departmentId: facDept.id,
      defaultPriority: TicketPriority.LOW,
      targetResolutionHours: 72,
      isActive: true,
    },
  });

  // 8. Example Tickets
  // Ticket 1: In Progress with history & messages
  const t1 = await prisma.ticket.upsert({
    where: { ticketNumber: 'NIT-20261107-1001' },
    update: {},
    create: {
      ticketNumber: 'NIT-20261107-1001',
      subject: 'عدم اتصال به اینترنت پرسرعت در خوابگاه شهید بهشتی',
      description: 'با سلام، از دیروز اتصال وای‌فای خوابگاه بلوک ۳ به طور مکرر قطع می‌شود و امکان اتصال به منابع کتابخانه دانشگاه وجود ندارد. لطفا بررسی فرمایید.',
      requesterId: student.id,
      serviceId: internetService.id,
      departmentId: itDept.id,
      assignedToId: itSpecialist.id,
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.HIGH,
    },
  });

  // Messages for t1
  await prisma.ticketMessage.createMany({
    data: [
      {
        ticketId: t1.id,
        authorId: student.id,
        content: 'با سلام، از دیروز اتصال وای‌فای خوابگاه بلوک ۳ به طور مکرر قطع می‌شود و امکان اتصال به منابع کتابخانه دانشگاه وجود ندارد. لطفا بررسی فرمایید.',
        isInternal: false,
      },
      {
        ticketId: t1.id,
        authorId: itSpecialist.id,
        content: 'سلام و احترام؛ روتر اکسس پوینت طبقه دوم خوابگاه ریستارت شد. لطفا MAC آدرس کارت شبکه لپ‌تاپ خود را جهت اختصاص IP استاتیک ارسال کنید.',
        isInternal: false,
      },
      {
        ticketId: t1.id,
        authorId: itSpecialist.id,
        content: 'یادداشت داخلی کارشناس: سوئیچ سیسکو طبقه ۲ دارای نوسان پورت است. به آقای مهندس مرادی برای بررسی کابل‌کشی اطلاع داده شود.',
        isInternal: true,
      },
    ],
  });

  // History for t1
  await prisma.ticketHistory.createMany({
    data: [
      {
        ticketId: t1.id,
        actorId: student.id,
        action: 'TICKET_CREATED',
        newValue: TicketStatus.NEW,
        note: 'تیکت توسط دانشجو ایجاد شد',
      },
      {
        ticketId: t1.id,
        actorId: itManager.id,
        action: 'TICKET_ASSIGNED',
        oldValue: 'بدون تخصیص',
        newValue: itSpecialist.fullName,
        note: 'تیکت به کارشناس شبکه تخصیص داده شد',
      },
      {
        ticketId: t1.id,
        actorId: itSpecialist.id,
        action: 'STATUS_CHANGED',
        oldValue: TicketStatus.ASSIGNED,
        newValue: TicketStatus.IN_PROGRESS,
        note: 'تغییر وضعیت به در حال بررسی',
      },
    ],
  });

  // Ticket 2: Resolved with feedback
  const t2 = await prisma.ticket.upsert({
    where: { ticketNumber: 'NIT-20261107-1002' },
    update: {},
    create: {
      ticketNumber: 'NIT-20261107-1002',
      subject: 'درخواست صدور گواهی اشتغال به تحصیل جهت ارائه به نظام وظیفه',
      description: 'احتراما اینجانب نیازمند گواهی اشتغال به تحصیل رسمی با ذکر تعداد واحدهای گذرانده شده جهت تمدید معافیت تحصیلی هستم.',
      requesterId: student.id,
      serviceId: certService.id,
      departmentId: eduDept.id,
      assignedToId: eduSpecialist.id,
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
      requesterId: student.id,
      rating: 5,
      comment: 'بسیار سریع و با دقت بالا گواهی صادر و ارسال گردید. با تشکر از اداره آموزش.',
    },
  });

  // Ticket 3: New Ticket from Faculty
  const t3 = await prisma.ticket.upsert({
    where: { ticketNumber: 'NIT-20261107-1003' },
    update: {},
    create: {
      ticketNumber: 'NIT-20261107-1003',
      subject: 'نقص فنی ویدئو پروژکتور کلاس ۱۰۲ دانشکده برق',
      description: 'تصویر ویدئو پروژکتور کلاس ۱۰۲ چشمک می‌زند و پس از چند دقیقه خاموش می‌شود. لطفا پیش از شروع کلاس‌های فردا بررسی فرمایید.',
      requesterId: faculty.id,
      serviceId: repairService.id,
      departmentId: facDept.id,
      assignedToId: facSpecialist.id,
      status: TicketStatus.NEW,
      priority: TicketPriority.NORMAL,
    },
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        recipientId: student.id,
        ticketId: t1.id,
        type: NotificationType.MESSAGE_RECEIVED,
        title: 'پاسخ جدید کارشناس',
        message: 'مهندس امیر قاسمی به تیکت NIT-20261107-1001 شما پاسخ داد.',
        isRead: false,
      },
      {
        recipientId: itSpecialist.id,
        ticketId: t1.id,
        type: NotificationType.TICKET_ASSIGNED,
        title: 'ارجاع تیکت جدید',
        message: 'تیکت NIT-20261107-1001 به شما محول گردید.',
        isRead: true,
      },
      {
        recipientId: student.id,
        ticketId: t2.id,
        type: NotificationType.TICKET_RESOLVED,
        title: 'تیکت حل شد',
        message: 'درخواست صدور گواهی اشتغال به تحصیل پاسخ داده شد.',
        isRead: true,
      },
    ],
  });

  console.log('✅ Database seeded successfully with users, departments, services, tickets, and notifications!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

