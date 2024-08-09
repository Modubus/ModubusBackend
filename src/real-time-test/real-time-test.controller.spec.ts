import { Test, TestingModule } from '@nestjs/testing';
import { RealTimeTestController } from './real-time-test.controller';

describe('RealTimeTestController', () => {
  let controller: RealTimeTestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RealTimeTestController],
    }).compile();

    controller = module.get<RealTimeTestController>(RealTimeTestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
