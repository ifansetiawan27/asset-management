import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS: izinkan semua origin (termasuk Cloudflare Pages & localhost).
  // Untuk produksi yang lebih ketat, ganti dengan daftar origin eksplisit:
  // origin: ['https://asset-management-9fk.pages.dev', 'http://localhost:3003']
  app.enableCors({
    origin: true,           // reflect request origin (izinkan semua)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  // Swagger UI (live API preview) di /docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Asset Management System API')
    .setDescription('AMS — Enterprise & SaaS Multi-Tenant')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Tenant-ID', in: 'header' }, 'tenant')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>('app.port') ?? 3000;
  await app.listen(port);
  Logger.log(`AMS API berjalan di http://localhost:${port}/api/v1`, 'Bootstrap');
  Logger.log(`Swagger UI: http://localhost:${port}/docs`, 'Bootstrap');
}

void bootstrap();
