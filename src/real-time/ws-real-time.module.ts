import { Module } from '@nestjs/common'
import { EventsGateway } from './ws-real-time.gateway'
import { EventsService } from './ws-real-time.service'

@Module({
  providers: [EventsGateway, EventsService],
})
export class EventsModule {}
