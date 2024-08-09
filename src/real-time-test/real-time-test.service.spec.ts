import { Test, TestingModule } from '@nestjs/testing';
import { RealTimeTestService } from './real-time-test.service';

describe('RealTimeTestService', () => {
  let service: RealTimeTestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RealTimeTestService],
    }).compile();

    service = module.get<RealTimeTestService>(RealTimeTestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
