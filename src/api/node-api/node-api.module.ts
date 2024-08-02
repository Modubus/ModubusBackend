import { Module } from '@nestjs/common'
import { NodeApiService } from './node-api.service'
import { NodeApiController } from './node-api.controller'

@Module({
  providers: [NodeApiService],
  controllers: [NodeApiController],
})
export class NodeApiModule {}
