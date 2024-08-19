// src/events/events.module.ts
import { Module } from '@nestjs/common'
import { EventsController } from './polling-real-time.controller'
import { EventsService } from './polling-real-time.service'

@Module({
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
