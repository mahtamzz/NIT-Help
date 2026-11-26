const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

function loadEnvFile() {
  const envPath = path.join(ROOT_DIR, '.env');
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  const parsed = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const val = trimmed.slice(eqIndex + 1).trim();
    parsed[key] = val;
  }
  return parsed;
}

const SERVICES = [
  { name: 'iam', schema: 'iam', envKey: 'IAM_DATABASE_URL', hasSeed: true },
  { name: 'core', schema: 'core', envKey: 'CORE_DATABASE_URL', hasSeed: true },
  { name: 'media', schema: 'media', envKey: 'MEDIA_DATABASE_URL', hasSeed: false },
  {
    name: 'notifications-ops',
    schema: 'ops',
    envKey: 'OPS_DATABASE_URL',
    hasSeed: true,
  },
];

const action = process.argv[2];
const targetService = process.argv[3];
const envFromFile = loadEnvFile();
const baseUrl =
  process.env.POSTGRES_BASE_URL ||
  envFromFile.POSTGRES_BASE_URL ||
  'postgresql://postgres:password123@localhost:5432/nit_help';

function resolveDatabaseUrl(svc) {
  return process.env[svc.envKey] || envFromFile[svc.envKey] || `${baseUrl}?schema=${svc.schema}`;
}

function runCommand(cmd, args, cwd, extraEnv = {}) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    env: { ...envFromFile, ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

const selected = targetService
  ? SERVICES.filter((s) => s.name === targetService)
  : SERVICES;

if (selected.length === 0) {
  console.error(`Unknown service: ${targetService}`);
  process.exit(1);
}

for (const svc of selected) {
  const svcDir = path.join(ROOT_DIR, 'backend', 'services', svc.name);
  const dbUrl = resolveDatabaseUrl(svc);

  if (action === 'prisma:generate') {
    console.log(`\n🔧 Generating Prisma client for ${svc.name}...`);
    runCommand('npm', ['run', 'prisma:generate'], svcDir, { DATABASE_URL: dbUrl });
  } else if (action === 'prisma:push') {
    console.log(`\n📦 Pushing schema (${svc.schema}) for ${svc.name}...`);
    runCommand('npm', ['run', 'prisma:push'], svcDir, { DATABASE_URL: dbUrl });
  } else if (action === 'prisma:seed') {
    if (!svc.hasSeed) continue;
    console.log(`\n🌱 Seeding ${svc.name} (${svc.schema})...`);
    runCommand('npm', ['run', 'prisma:seed'], svcDir, { DATABASE_URL: dbUrl });
  } else if (action === 'start:dev') {
    console.log(`\n🚀 Starting ${svc.name} in dev mode...`);
    runCommand('npm', ['run', 'start:dev'], svcDir, { DATABASE_URL: dbUrl });
  } else {
    console.error('Usage: node scripts/service-exec.js <prisma:generate|prisma:push|prisma:seed|start:dev> [service-name]');
    process.exit(1);
  }
}
