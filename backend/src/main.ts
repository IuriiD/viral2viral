/**
 * Main Application Bootstrap
 *
 * Initializes NestJS application with global filters, interceptors, and CORS.
 */

// Load environment variables FIRST before anything else
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import {
  loadConfiguration,
  validateConfiguration,
} from './config/configuration';

async function bootstrap() {
  // Load and validate configuration
  const config = loadConfiguration();
  validateConfiguration(config);

  console.log('Starting UGC Video Generator API...');
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Port: ${config.port}`);

  // Create NestJS application
  const app = await NestFactory.create(AppModule);

  // Set global prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Start server
  await app.listen(config.port);

  console.log(`Application is running on: http://localhost:${config.port}`);
  console.log(`API endpoint: http://localhost:${config.port}/api`);
  console.log(`Health check: http://localhost:${config.port}/api/health`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
