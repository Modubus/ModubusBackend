// src/events/events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { EventsService } from './ws-real-time.service'

@WebSocketGateway({
  cors: {
    origin: '*', // CORS 설정
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server
  private logger: Logger = new Logger('EventsGateway')

  constructor(private readonly eventsService: EventsService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket server initialized')
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    const user = this.eventsService.removeUser(client.id)
    if (user) {
      this.notifyAllClients('userExited', user)
      this.logger.log(`Client disconnected: ${client.id} (${user.name})`)
    }
  }

  notifyAllClients(event: string, data: any) {
    this.server.emit(event, data)
  }
}
