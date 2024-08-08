import { Global, Module } from '@nestjs/common'
import { BusStopApiService } from './bus-stop-api.service'
import { HttpModule } from '@nestjs/axios'
import { ConfigModule } from '@nestjs/config'
import { ApiController } from './bus-stop-api.controller'

@Global()
@Module({
  imports: [ConfigModule, HttpModule],
  providers: [BusStopApiService],
  exports: [BusStopApiService],
  controllers: [ApiController],
})
export class ApiModule {}
