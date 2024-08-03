import { PrismaClient } from '@prisma/client'
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto/user.dto'
import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly jwtService: JwtService,
  ) {}

  async getUsers() {
    return await this.prisma.user.findMany()
  }

  async getUserByUsername(username: string) {
    return await this.prisma.user.findMany({
      where: {
        username,
      },
    })
  }

  async validateUser(loginUserDto: LoginUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        username: loginUserDto.username,
      },
    })

    if (
      !user ||
      !(await bcrypt.compare(loginUserDto.password, user.password))
    ) {
      return false
    }
    return true
  }

  async issueJwtTokens(loginUserDto: LoginUserDto) {
    const userId = (
      await this.prisma.user.findFirst({
        where: {
          username: loginUserDto.username,
        },
        select: {
          id: true,
        },
      })
    ).id

    return await this.createJwtTokens(userId, loginUserDto.username)
  }

  async reissueAccessToken(refreshToken: string) {
    const { userId, username } = await this.jwtService.verifyAsync(
      refreshToken,
      {
        secret: process.env.JWT_SECRET,
      },
    )

    return await this.createJwtTokens(userId, username)
  }

  async createJwtTokens(userId: number, username: string) {
    const accessToken = await this.jwtService.signAsync(
      { userId, username },
      {
        expiresIn: '10m',
      },
    )
    const refreshToken = await this.jwtService.signAsync(
      { userId, username },
      {
        expiresIn: '14d',
      },
    )

    return {
      accessToken,
      refreshToken,
    }
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

  async updateUser(userId: number, updateUserDto: UpdateUserDto) {
    let hashedPassword: string
    const { password, ...data } = updateUserDto

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...data,
        password: hashedPassword ? hashedPassword : undefined,
      },
    })

    return user
  }

  async deleteUser(userId: number) {
    return await this.prisma.user.delete({
      where: {
        id: userId,
      },
    })
  }
}
