import { Module } from '@nestjs/common'
import { NodeApiService } from './node-api.service'
import { NodeApiController } from './node-api.controller'
import { HttpModule } from '@nestjs/axios'
@Module({
  imports: [HttpModule],
  providers: [NodeApiService],
  controllers: [NodeApiController],
})
export class NodeApiModule {}
