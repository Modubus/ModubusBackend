import { Test, TestingModule } from '@nestjs/testing';
import { RealTimeTestGateway } from './real-time-test.gateway';

describe('RealTimeTestGateway', () => {
  let gateway: RealTimeTestGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RealTimeTestGateway],
    }).compile();

    gateway = module.get<RealTimeTestGateway>(RealTimeTestGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
