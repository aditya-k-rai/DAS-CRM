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
  // Dynamic CORS configuration supporting local dev, Vercel, Render, and custom domains
  const allowedOriginsRaw = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  const allowedList = allowedOriginsRaw.split(',').map((s) => s.trim()).filter(Boolean);
  allowedList.push(
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
  );

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests (mobile app, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow if present in allowed list
      if (allowedList.includes(origin)) return callback(null, true);
      // Allow any Vercel deployment preview or production domain
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      // Allow any Render deployment domain
      if (origin.endsWith('.onrender.com')) return callback(null, true);
      // Permissive fallback to ensure live websites never hit CORS blocks
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-tenant-id',
      'x-organization-id',
      'Accept',
      'Origin',
    ],
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

  const server = await app.listen(port);
  if (server && 'keepAliveTimeout' in server) {
    (server as any).keepAliveTimeout = 65000;
    (server as any).headersTimeout = 66000;
  }
  Logger.log(`🚀 CRM Backend running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(
    `📚 Swagger docs at http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}

bootstrap();
