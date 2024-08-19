import { Module } from '@nestjs/common'
import { NodeApiService } from './node-api.service'
import { HttpModule } from '@nestjs/axios'
@Module({
  imports: [HttpModule],
  providers: [NodeApiService],
  exports: [NodeApiService],
})
export class NodeApiModule {}
