import { NestFactory } from '@nestjs/core';
import { CommandModule, CommandService } from 'nestjs-command';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const commandService = app.select(CommandModule).get(CommandService);
    await commandService.exec();
  } catch (error) {
    console.error(error);
  } finally {
    await app.close();
  }
}

bootstrap();
