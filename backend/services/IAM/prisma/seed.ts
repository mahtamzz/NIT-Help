import { SEED_IDS } from '@nit-help/microservice-common';
import * as bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '../node_modules/.prisma/iam-client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding IAM schema (users & department replicas)...');

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin@123456', saltRounds);
  const managerPasswordHash = await bcrypt.hash('Manager@123456', saltRounds);
  const specialistPasswordHash = await bcrypt.hash('Specialist@123456', saltRounds);
  const studentPasswordHash = await bcrypt.hash('Student@123456', saltRounds);
  const facultyPasswordHash = await bcrypt.hash('Faculty@123456', saltRounds);

  const deptReplicas = [
    {
      id: SEED_IDS.DEPARTMENTS.IT,
      name: 'مرکز فناوری اطلاعات و ارتباطات',
      code: 'IT',
    },
    {
      id: SEED_IDS.DEPARTMENTS.EDU,
      name: 'معاونت آموزشی و تحصیلات تکمیلی',
      code: 'EDU',
    },
    {
      id: SEED_IDS.DEPARTMENTS.FAC,
      name: 'اداره پشتیبانی، فنی و تأسیسات',
      code: 'FAC',
    },
  ];

  for (const dept of deptReplicas) {
    await prisma.departmentReplica.upsert({
      where: { id: dept.id },
      update: { name: dept.name, code: dept.code, isActive: true },
      create: { id: dept.id, name: dept.name, code: dept.code, isActive: true },
    });
  }

  const users = [
    {
      id: SEED_IDS.USERS.ADMIN,
      email: 'admin@nit.ac.ir',
      username: 'admin',
      fullName: 'مهندس محمد علوی (مدیر ارشد سامانه)',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      departmentId: null,
    },
    {
      id: SEED_IDS.USERS.IT_MANAGER,
      email: 'it.manager@nit.ac.ir',
      username: 'it_manager',
      fullName: 'دکتر رضا حسینی (مدیر فناوری اطلاعات)',
      passwordHash: managerPasswordHash,
      role: UserRole.MANAGER,
      departmentId: SEED_IDS.DEPARTMENTS.IT,
    },
    {
      id: SEED_IDS.USERS.EDU_MANAGER,
      email: 'edu.manager@nit.ac.ir',
      username: 'edu_manager',
      fullName: 'دکتر مریم صادقی (مدیر امور آموزشی)',
      passwordHash: managerPasswordHash,
      role: UserRole.MANAGER,
      departmentId: SEED_IDS.DEPARTMENTS.EDU,
    },
    {
      id: SEED_IDS.USERS.FAC_MANAGER,
      email: 'facilities.manager@nit.ac.ir',
      username: 'fac_manager',
      fullName: 'مهندس علی کاظمی (مدیر تأسیسات)',
      passwordHash: managerPasswordHash,
      role: UserRole.MANAGER,
      departmentId: SEED_IDS.DEPARTMENTS.FAC,
    },
    {
      id: SEED_IDS.USERS.IT_SPECIALIST,
      email: 'it.specialist@nit.ac.ir',
      username: 'it_spec',
      fullName: 'مهندس امیر قاسمی (کارشناس شبکه و سامانه‌ها)',
      passwordHash: specialistPasswordHash,
      role: UserRole.SPECIALIST,
      departmentId: SEED_IDS.DEPARTMENTS.IT,
    },
    {
      id: SEED_IDS.USERS.EDU_SPECIALIST,
      email: 'edu.specialist@nit.ac.ir',
      username: 'edu_spec',
      fullName: 'سرکار خانم ناصری (کارشناس فارغ‌التحصیلان)',
      passwordHash: specialistPasswordHash,
      role: UserRole.SPECIALIST,
      departmentId: SEED_IDS.DEPARTMENTS.EDU,
    },
    {
      id: SEED_IDS.USERS.FAC_SPECIALIST,
      email: 'fac.specialist@nit.ac.ir',
      username: 'fac_spec',
      fullName: 'آقای احمد مرادی (کارشناس تأسیسات و نگهداری)',
      passwordHash: specialistPasswordHash,
      role: UserRole.SPECIALIST,
      departmentId: SEED_IDS.DEPARTMENTS.FAC,
    },
    {
      id: SEED_IDS.USERS.STUDENT,
      email: 'student@nit.ac.ir',
      username: 'student',
      fullName: 'علی اکبری (دانشجوی مهندسی کامپیوتر)',
      passwordHash: studentPasswordHash,
      role: UserRole.STUDENT,
      departmentId: null,
    },
    {
      id: SEED_IDS.USERS.FACULTY,
      email: 'faculty@nit.ac.ir',
      username: 'faculty',
      fullName: 'دکتر بهنام مرادی (عضو هیئت علمی دانشکده برق)',
      passwordHash: facultyPasswordHash,
      role: UserRole.FACULTY,
      departmentId: null,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash: u.passwordHash,
        fullName: u.fullName,
        role: u.role,
        departmentId: u.departmentId,
        isActive: true,
      },
      create: {
        id: u.id,
        email: u.email,
        username: u.username,
        fullName: u.fullName,
        passwordHash: u.passwordHash,
        role: u.role,
        departmentId: u.departmentId,
        isActive: true,
      },
    });
  }

  console.log('✅ IAM schema seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding IAM schema:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
