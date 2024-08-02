import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './user/user.module'
import { BusModule } from './bus/bus.module'
import { PrismaModule } from './prisma/prisma.module'
import { DriverModule } from './driver/driver.module'
import { ApiModule } from './api/bus-api/api.module'
import { NodeApiModule } from './node-api/node-api.module';
import { BusAipModule } from './node-api/bus-aip/bus-aip.module';
import { NodeApiModule } from './node-api/bus-node-api/node-api/node-api.module';
import { NodeApiModule } from './api/bus-node-api/node-api/node-api.module';
import { NodeApiModule } from './api/node-api/node-api.module';

@Module({
  imports: [UserModule, BusModule, PrismaModule, DriverModule, ApiModule, NodeApiModule, BusAipModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
