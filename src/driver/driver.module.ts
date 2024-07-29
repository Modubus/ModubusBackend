import { Module } from '@nestjs/common'
import { DriverService } from './driver.service'
import { DriverController } from './driver.controller'

@Module({
  providers: [DriverService],
  controllers: [DriverController],
})
export class DriverModule {}
