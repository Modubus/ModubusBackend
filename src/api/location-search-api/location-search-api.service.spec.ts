import { Test, TestingModule } from '@nestjs/testing';
import { LocationSearchApiService } from './location-search-api.service';

describe('LocationSearchApiService', () => {
  let service: LocationSearchApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocationSearchApiService],
    }).compile();

    service = module.get<LocationSearchApiService>(LocationSearchApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
