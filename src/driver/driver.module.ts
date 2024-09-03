import { Module } from '@nestjs/common'
import { DriverService } from './driver.service'
import { DriverController } from './driver.controller'
import { BusModule } from 'src/bus/bus.module'

@Module({
  providers: [DriverService],
  controllers: [DriverController],
  exports: [DriverService],
})
export class DriverModule {}
