import { Test, TestingModule } from '@nestjs/testing';
import { LocationSearchApiController } from './location-search-api.controller';

describe('LocationSearchApiController', () => {
  let controller: LocationSearchApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationSearchApiController],
    }).compile();

    controller = module.get<LocationSearchApiController>(LocationSearchApiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
