import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(5001); // Use 5001 to avoid conflict with port 5000
  console.log('NestJS API running on port 5001');
}
bootstrap();
