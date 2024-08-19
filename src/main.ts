import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import * as dotenv from 'dotenv'
import * as cookieParser from 'cookie-parser'
import { UncaughtExceptionsFilter } from './lib/pipe/uncaught-exceptions.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  dotenv.config()
  app.use(cookieParser())
  app.useGlobalPipes(new ValidationPipe())
  app.useGlobalFilters(new UncaughtExceptionsFilter())
  app.enableCors({
    origin: ['http://localhost:5173', 'https://modubus.jaemin-dev.store/'],
    credentials: true,
    allowedHeaders: ['*'],
    exposedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 86400, // 1 day
  })
  await app.listen(3000)
}
bootstrap()
