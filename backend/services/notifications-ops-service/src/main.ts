import { bootstrapHybridMicroservice } from '@nit-help/microservice-common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHybridMicroservice({
    appModule: AppModule,
    serviceName: 'Notifications & Ops Service',
    serviceSlug: 'ops',
    swaggerTitle: 'NIT-Help Notifications & Ops Service API',
    swaggerDescription: 'سرویس رویدادمحور اعلان‌ها، ثبت لاگ‌های حسابرسی و گزارش‌های تحلیلی',
    httpPort: Number(process.env.OPS_PORT || process.env.PORT || 4004),
    tcpPort: Number(process.env.OPS_TCP_PORT || 4104),
  });
}

bootstrap();
