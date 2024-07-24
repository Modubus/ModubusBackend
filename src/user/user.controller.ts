import { Prisma } from '@prisma/client'
import { CreateUserDto } from './dto/create-user.dto'
import { UserService } from './user.service'
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 모든 유저 정보를 불러옵니다.
   */
  @Get()
  async getUsers() {
    try {
      return await this.userService.getUsers()
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * 새로운 유저 정보를 저장합니다.(회원가입)
   * @param createUserDto 유저 정보
   */
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      return await this.userService.createUser(createUserDto)
    } catch (error) {
      console.log(error)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException(
          'User already exists or invalid request',
          HttpStatus.CONFLICT,
        )
      }
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
