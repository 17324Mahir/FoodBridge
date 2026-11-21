import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configureSwaggerDemo, makeSwaggerDemo } from './swagger/swagger-demo.js';

async function bootstrap() {
  const demo = configureSwaggerDemo();
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('FoodBridge API')
    .setDescription('API documentation for FoodBridge.')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token.',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const swaggerOptions = demo ? await makeSwaggerDemo(app, document) : undefined;
  SwaggerModule.setup('apis', app, document, swaggerOptions);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:true,
      forbidNonWhitelisted:true,
      transform:true
    })
  )

  const port = process.env.PORT ?? 3000;
  if (demo) {
    await app.listen(port, '127.0.0.1');
  } else {
    await app.listen(port);
  }
}
await bootstrap();
