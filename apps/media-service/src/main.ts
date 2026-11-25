import { bootstrapHybridMicroservice } from '@nit-help/microservice-common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHybridMicroservice({
    appModule: AppModule,
    serviceName: 'Media Service',
    serviceSlug: 'media',
    swaggerTitle: 'NIT-Help Media Service API',
    swaggerDescription: 'سرویس بارگذاری، ذخیره‌سازی و دانلود امن فایل‌های پیوست تیکت‌ها',
    httpPort: Number(process.env.MEDIA_PORT || process.env.PORT || 4003),
    tcpPort: Number(process.env.MEDIA_TCP_PORT || 4103),
  });
}

bootstrap();
