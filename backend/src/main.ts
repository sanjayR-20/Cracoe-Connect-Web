import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createSignalingServer } from './signaling/signaling.server';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');

  const httpServer = app.getHttpServer();
  createSignalingServer(httpServer);
}

bootstrap();
