import { Module } from '@nestjs/common';
import { RealTimeTestController } from './real-time-test.controller';
import { RealTimeTestGateway } from './real-time-test.gateway';

@Module({
  controllers: [RealTimeTestController],
  providers: [RealTimeTestGateway]
})
export class RealTimeTestModule {}
