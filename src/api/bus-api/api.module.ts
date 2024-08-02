import { Global, Module } from '@nestjs/common'
import { ApiService } from './api.service'
import { HttpModule } from '@nestjs/axios'
import { ConfigModule } from '@nestjs/config'
import { ApiController } from './api.controller'

@Global()
@Module({
  imports: [ConfigModule, HttpModule],
  providers: [ApiService],
  exports: [ApiService],
  controllers: [ApiController],
})
export class ApiModule {}
