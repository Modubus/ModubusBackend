import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './user/user.module'
import { BusModule } from './bus/bus.module'
import { PrismaModule } from './prisma/prisma.module'
import { DriverModule } from './driver/driver.module'
import { NodeApiModule } from './api/node-api/node-api.module'
import { ApiModule } from './api/bus-stop-api/bus-stop-api.module'
import { ApiModule } from './location-search-api/api/api.module';
import { LocationSearchApiModule } from './api/location-search-api/location-search-api.module';
import { OdsayApiController } from './api/odsay-api/odsay-api.controller';
import { OdsayApiModule } from './api/odsay-api/odsay-api.module';

@Module({
  imports: [
    UserModule,
    BusModule,
    PrismaModule,
    DriverModule,
    ApiModule,
    NodeApiModule,
    LocationSearchApiModule,
    OdsayApiModule,
  ],
  controllers: [AppController, OdsayApiController],
  providers: [AppService],
})
export class AppModule {}
