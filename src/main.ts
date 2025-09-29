import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MongooseExceptionFilter } from './filters/mongoose-exception.filter';
import * as express from 'express';

import { join } from 'path'; 
import * as fs from 'fs-extra';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Tehele API')
    .setDescription('The Tehele Platform API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  const outputPath = path.resolve(__dirname, '../swagger-spec.json');
  fs.writeJsonSync(outputPath, document);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'x-profile-type',
      'x-profile-id',
    ],
    credentials: true,
    exposedHeaders: ['x-profile-type', 'x-profile-id'],
  });

  app.use('/swagger-spec.json', express.static(outputPath));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new MongooseExceptionFilter());
  //  app.use(new DelayMiddleware().use); // Apply the delay middleware

  app.use('/docs', async (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>API Docs</title>
          <!-- needed for adaptive design -->
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">

          <!--
          ReDoc doesn't change outer page styles
          -->
          <style>
            body {
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body>
          <redoc spec-url='/swagger-spec.json'></redoc>
          <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"> </script>
        </body>
      </html>
    `);
  });
  // Serve static files from the 'public' directory at the project root
  app.use('/public', express.static(join(__dirname, '..', 'public')));

  // Serve tenant.html when /tenant is accessed
  app.use('/tenant', async (req, res) => {
    res.sendFile(join(__dirname, '..', 'public', 'tenant.html')); // Serve tenant.html
  });
  await app.listen(process.env.PORT || 4000);
}
bootstrap();
