import { Global, Module } from '@nestjs/common'
import { BusStopApiService } from './bus-stop-api.service'
import { HttpModule } from '@nestjs/axios'
import { ConfigModule } from '@nestjs/config'

@Global()
@Module({
  imports: [ConfigModule, HttpModule],
  providers: [BusStopApiService],
  exports: [BusStopApiService],
})
export class ApiModule {}
