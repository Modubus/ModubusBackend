import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './user/user.module'
import { BusModule } from './bus/bus.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [UserModule, BusModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
