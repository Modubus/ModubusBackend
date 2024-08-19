import { Module } from '@nestjs/common'
import { OdsayApiService } from './odsay-api.service'

@Module({
  providers: [OdsayApiService],
  exports: [OdsayApiService],
})
export class OdsayApiModule {}
