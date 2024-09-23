import { Module } from '@nestjs/common'
import { DriverService } from './driver.service'
import { DriverController } from './driver.controller'
import { NodeApiService } from 'src/api/node-api/node-api.service'
import { PrismaClient } from '@prisma/client'

@Module({
  providers: [DriverService, NodeApiService, PrismaClient],
  controllers: [DriverController],
  exports: [DriverService],
})
export class DriverModule {}
