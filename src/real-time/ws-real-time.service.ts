// src/events/events.service.ts
import { Injectable } from '@nestjs/common'

interface User {
  id: string
  name: string
}

@Injectable()
export class EventsService {
  private users: User[] = []

  addUser(user: User) {
    this.users.push(user)
  }

  removeUser(id: string): User | undefined {
    const user = this.users.find((u) => u.id === id)
    if (user) {
      this.users = this.users.filter((u) => u.id !== id)
    }
    return user
  }

  getUsers(): User[] {
    return this.users
  }
}
