import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

export interface MicroserviceBootstrapOptions {
  appModule: any;
  serviceName: string;
  serviceSlug: string;
  swaggerTitle: string;
  swaggerDescription: string;
  httpPort: number;
  tcpPort?: number;
}

export async function bootstrapHybridMicroservice(
  options: MicroserviceBootstrapOptions,
): Promise<INestApplication> {
  const logger = new Logger(`Bootstrap:${options.serviceName}`);
  const app = await NestFactory.create(options.appModule);

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle(options.swaggerTitle)
    .setDescription(options.swaggerDescription)
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`api/${options.serviceSlug}/docs`, app, document);

  if (options.tcpPort) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: options.tcpPort,
      },
    });
    await app.startAllMicroservices();
    logger.log(`${options.serviceName} TCP microservice listening on port ${options.tcpPort}`);
  }

  await app.listen(options.httpPort, '0.0.0.0');
  logger.log(`${options.serviceName} HTTP server running on port ${options.httpPort}`);
  logger.log(
    `Swagger Docs available at /api/${options.serviceSlug}/docs`,
  );

  return app;
}
