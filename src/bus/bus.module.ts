import { Logger, Module } from '@nestjs/common'
import { BusController } from './bus.controller'
import { BusService } from './bus.service'
import { LocationSearchApiModule } from 'src/api/location-search-api/location-search-api.module'
import { ApiModule } from 'src/api/bus-stop-api/bus-stop-api.module'
import { OdsayApiModule } from 'src/api/odsay-api/odsay-api.module'
import { NodeApiModule } from 'src/api/node-api/node-api.module'
import { DriverModule } from 'src/driver/driver.module'

@Module({
  controllers: [BusController],
  providers: [BusService, Logger],
  imports: [
    LocationSearchApiModule,
    ApiModule,
    OdsayApiModule,
    NodeApiModule,
    DriverModule,
  ],
})
export class BusModule {}
