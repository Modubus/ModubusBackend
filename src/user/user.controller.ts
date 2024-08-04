import { Prisma } from '@prisma/client'
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto/user.dto'
import { UserFavoriteService, UserService } from './user.service'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { RequestWithUser } from 'src/lib/class/request-with-user.class'
import { Request, Response } from 'express'
import { JwtAuthGuard } from 'src/lib/guard/jwt-auth.guard'
import { UserFavoriteDto } from './dto/user-favorite.dto'

@Controller('user')
export class UserController {
  REFRESH_TOKEN_NAME = 'refresh_token'
  constructor(private readonly userService: UserService) {}

  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // id, pw 확인
    if (!(await this.userService.validateUser(loginUserDto))) {
      throw new HttpException(
        'check your username or password again',
        HttpStatus.UNAUTHORIZED,
      )
    }

    // jwt 발급
    const tokens = await this.userService.issueJwtTokens(loginUserDto)
    res.setHeader('Authorization', `Bearer ${tokens.accessToken}`)
    res.cookie(this.REFRESH_TOKEN_NAME, tokens.refreshToken)
  }

  /**
   * Access Token이 만료된 경우, Refresh Token을 사용해 Access Token을 재발급합니다.
   * @returns
   */
  @Get('reissue')
  async reissueAccessToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies[this.REFRESH_TOKEN_NAME]
    if (!refreshToken) {
      throw new HttpException(
        'There is no refresh token',
        HttpStatus.UNAUTHORIZED,
      )
    }

    // jwt 재발급
    const tokens = await this.userService.reissueAccessToken(refreshToken)
    res.setHeader('authorization', `Bearer ${tokens.accessToken}`)
    res.cookie(this.REFRESH_TOKEN_NAME, tokens.refreshToken)
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(this.REFRESH_TOKEN_NAME)
  }

  /**
   * 모든 유저 정보를 불러옵니다. (테스트용 기능, 삭제 예정)
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

  /**
   * 유저의 정보를 수정합니다.
   * @param updateUserDto 수정할 유저 정보
   */
  @UseGuards(JwtAuthGuard)
  @Put()
  async updateUser(
    @Req() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      return await this.userService.updateUser(req.user.userId, updateUserDto)
    } catch (error) {
      console.log(error)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException(
          'invalid userId or invalid update request',
          HttpStatus.BAD_REQUEST,
        )
      }
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * 유저를 제거합니다.
   */
  @UseGuards(JwtAuthGuard)
  @Delete()
  async deleteUser(@Req() req: RequestWithUser) {
    try {
      return await this.userService.deleteUser(req.user.userId)
    } catch (error) {
      console.log(error)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('User does not exist', HttpStatus.NOT_FOUND)
      }
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}

/**
 * 즐겨찾기 관련 API (로그인 필요)
 */
@UseGuards(JwtAuthGuard)
@Controller('user/favorite')
export class UserFavoriteController {
  constructor(private readonly userFavoriteService: UserFavoriteService) {}

  @Get()
  async getUserFavorites(@Req() req: RequestWithUser) {
    try {
      return await this.userFavoriteService.getUserFavorites(req.user.userId)
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post()
  async createUserFavorite(
    @Req() req: RequestWithUser,
    @Body() userFavoriteDto: UserFavoriteDto,
  ) {
    try {
      return await this.userFavoriteService.createUserFavorite(
        req.user.userId,
        userFavoriteDto,
      )
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException(
          'An issue occurred during user creation',
          HttpStatus.CONFLICT,
        )
      }
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Delete('/:userFavoriteId')
  async deleteUserFavorite(
    @Req() req: RequestWithUser,
    @Param('userFavoriteId', ParseIntPipe) userFavoriteId: number,
  ) {
    try {
      return await this.userFavoriteService.deleteUserFavorite(
        req.user.userId,
        userFavoriteId,
      )
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException(
          'User favorite does not exist',
          HttpStatus.NOT_FOUND,
        )
      }
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
