// src/events/events.controller.ts
import { Controller, Post, Body } from '@nestjs/common'
import { EventsService } from './ws-real-time.service'
import { EventsGateway } from './ws-real-time.gateway'

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventsGateway: EventsGateway, // Gateway 주입
  ) {}

  @Post('board')
  boardUser(@Body() user: { id: string; name: string }) {
    this.eventsService.addUser(user)
    this.eventsGateway.notifyAllClients('userBoarded', user)
    return { status: 'User boarded' }
  }

  @Post('exit')
  exitUser(@Body() userId: { id: string }) {
    const user = this.eventsService.removeUser(userId.id)
    if (user) {
      this.eventsGateway.notifyAllClients('userExited', user)
      return { status: 'User exited' }
    }
    return { status: 'User not found' }
  }
}
