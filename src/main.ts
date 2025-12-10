import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import dataSource from './database/typeorm.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await dataSource.initialize();

  await dataSource.runMigrations();
  console.log('Migrations are run successfully.');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
