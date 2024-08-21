import { Controller, Get, Post, Body } from '@nestjs/common'
import { EventsService } from './polling-real-time.service'

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('polling')
  async polling() {
    return await this.eventsService.waitForEvent()
  }

  @Post('board')
  boardUser(@Body() user: { id: string; name: string }) {
    this.eventsService.addUser(user)
    return { status: 'User boarded' }
  }

  @Post('exit')
  exitUser(@Body() userId: { id: string }) {
    this.eventsService.removeUser(userId.id)
    return { status: 'User exited' }
  }
}
