import { PrismaClient } from '@prisma/client'
import { CreateUserDto } from './dto/create-user.dto'
import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async getUsers() {
    return await this.prisma.user.findMany()
  }

  async createUser(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10)

    const user = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        password: hashedPassword,
        email: createUserDto.email,
        disableType: createUserDto.disableType,
      },
    })

    return user
  }
}
