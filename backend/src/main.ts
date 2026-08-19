import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create(AppModule, {
    logger: isProd ? ['error', 'warn'] : ['error', 'warn', 'log'],
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  // Security
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Business CRM API')
    .setDescription('Final Business CRM — Web + Android')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  Logger.log(`🚀 CRM Backend running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(
    `📚 Swagger docs at http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}

bootstrap();
