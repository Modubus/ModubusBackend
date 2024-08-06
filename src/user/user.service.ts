import { PrismaClient, Require } from '@prisma/client'
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto/user.dto'
import * as bcrypt from 'bcryptjs'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserFavoriteDto } from './dto/user-favorite.dto'

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

@Injectable()
export class UserFavoriteService {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserFavorites(userId: number) {
    return await this.prisma.userFavorite.findMany({
      where: {
        userId,
      },
    })
  }

  async createUserFavorite(userId: number, userFavoriteDto: UserFavoriteDto) {
    return await this.prisma.userFavorite.create({
      data: {
        userId,
        routnm: userFavoriteDto.routnm,
        nodeId: userFavoriteDto.nodeId,
      },
    })
  }

  async deleteUserFavorite(userId: number, userFavoriteId: number) {
    return await this.prisma.userFavorite.delete({
      where: {
        id: userFavoriteId,
        userId,
      },
    })
  }
}

@Injectable()
export class UserNeedsService {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserNeeds(userId: number) {
    return await this.prisma.userRequire.findMany({
      where: {
        userId,
      },
    })
  }

  async createUserNeeds(userId: number, require: Require) {
    const userRequire = await this.prisma.userRequire.findFirst({
      where: {
        userId,
        require,
      },
    })

    // 이미 유저가 해당 타입의 요청사항을 등록한 경우
    if (userRequire) {
      throw new HttpException(
        'User already registered this kind of user-needs',
        HttpStatus.CONFLICT,
      )
    }

    return await this.prisma.userRequire.create({
      data: {
        userId,
        require,
      },
    })
  }

  async deleteUserNeeds(userId: number, userRequireId: number) {
    return await this.prisma.userRequire.delete({
      where: {
        id: userRequireId,
        userId,
      },
    })
  }
}
