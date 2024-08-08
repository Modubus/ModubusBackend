import { Module } from '@nestjs/common';
import { LocationSearchApiService } from './location-search-api.service';
import { LocationSearchApiController } from './location-search-api.controller';

@Module({
  providers: [LocationSearchApiService],
  controllers: [LocationSearchApiController]
})
export class LocationSearchApiModule {}
