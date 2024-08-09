import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './user/user.module'
import { BusModule } from './bus/bus.module'
import { PrismaModule } from './prisma/prisma.module'
import { DriverModule } from './driver/driver.module'
import { NodeApiModule } from './api/node-api/node-api.module'
import { LocationSearchApiModule } from './api/location-search-api/location-search-api.module'
import { OdsayApiModule } from './api/odsay-api/odsay-api.module'
import { RealTimeTestService } from './real-time-test/real-time-test.service';
import { RealTimeTestModule } from './real-time-test/real-time-test.module';

@Module({
  imports: [
    UserModule,
    BusModule,
    PrismaModule,
    DriverModule,
    NodeApiModule,
    LocationSearchApiModule,
    OdsayApiModule,
    RealTimeTestModule,
  ],
  controllers: [AppController],
  providers: [AppService, RealTimeTestService],
})
export class AppModule {}
