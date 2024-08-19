// src/events/events.service.ts
import { Injectable } from '@nestjs/common'

@Injectable()
export class EventsService {
  private users = []
  private resolveFunctions = []

  addUser(user: any) {
    this.users.push(user)
    this.notifyClients(user, 'userBoarded')
  }

  removeUser(userId: string) {
    const user = this.users.find((u) => u.id === userId)
    if (user) {
      this.users = this.users.filter((u) => u.id !== userId)
      this.notifyClients(user, 'userExited')
    }
  }

  // 대기 중인 클라이언트에게 데이터 전송
  private notifyClients(data: any, event: string) {
    this.resolveFunctions.forEach((resolve) => resolve({ event, data }))
    this.resolveFunctions = []
  }

  waitForEvent(): Promise<any> {
    return new Promise((resolve) => {
      this.resolveFunctions.push(resolve)
    })
  }
}
