import { Module } from '@nestjs/common'
import { LocationSearchApiService } from './location-search-api.service'

@Module({
  providers: [LocationSearchApiService],
})
export class LocationSearchApiModule {}
