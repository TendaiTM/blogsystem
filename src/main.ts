import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

let cachedApp: any;

async function bootstrapServer() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000', // Your Next.js frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization',
      'x-api-key',
      'X-API-Key'
    ],
  });

  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Blog API')
    .setDescription('Complete Blog Management System with File Upload and Authentication')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('blog-posts', 'Blog post management endpoints')
    .addTag('comments', 'Comment management endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('auth', 'Authentication endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'Blog API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  console.log('📚 Swagger documentation available at: http://localhost:3005/api-docs');

  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await bootstrapServer();
  }
  return cachedApp(req, res);
}

// Local development - only run if not in Vercel environment
if (!process.env.VERCEL) {
  bootstrapServer().then(app => {
    const port = process.env.PORT || 3005;
    app.listen(port, () => {
      console.log(`🚀 Application is running on: http://localhost:${port}`);
      console.log(`📚 Swagger docs: http://localhost:${port}/api-docs`);
    });
  });
}
