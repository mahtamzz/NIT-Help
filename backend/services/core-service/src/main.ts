import { bootstrapHybridMicroservice } from '@nit-help/microservice-common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHybridMicroservice({
    appModule: AppModule,
    serviceName: 'Core Service',
    serviceSlug: 'core',
    swaggerTitle: 'NIT-Help Core Service API',
    swaggerDescription: 'سرویس هسته سامانه شامل کاتالوگ خدمات، دپارتمان‌ها و چرخه کامل تیکتینگ',
    httpPort: Number(process.env.CORE_PORT || process.env.PORT || 4002),
    tcpPort: Number(process.env.CORE_TCP_PORT || 4102),
  });
}

bootstrap();
