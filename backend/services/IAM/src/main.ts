import { bootstrapHybridMicroservice } from '@nit-help/microservice-common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHybridMicroservice({
    appModule: AppModule,
    serviceName: 'IAM Service',
    serviceSlug: 'iam',
    swaggerTitle: 'NIT-Help IAM Service API',
    swaggerDescription: 'سرویس احراز هویت، صدور/بررسی توکن JWT و مدیریت کاربران',
    httpPort: Number(process.env.IAM_PORT || process.env.PORT || 4001),
    tcpPort: Number(process.env.IAM_TCP_PORT || 4101),
  });
}

bootstrap();
