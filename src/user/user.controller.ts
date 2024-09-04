import { Prisma, Require } from '@prisma/client'
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto/user.dto'
import {
  UserFavoriteService,
  UserNeedsService,
  UserService,
} from './user.service'
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

  /**
   * fingerprint를 바탕으로 등록된 기기(유저)인지 확인합니다.
   * 등록된 유저라면, 토큰 생성 후 반환
   * 등록되지 않은 유저라면, DB에 기기 정보 등록 후 토큰 반환
   */
  @Post('check-device')
  async checkDevice(
    @Body('fingerprint') fingerprint: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isUserAlreadyExists = await this.userService.isFingerprintRegistered(
      fingerprint,
    )

    if (!isUserAlreadyExists) {
      await this.userService.createUser(fingerprint)
    }

    // jwt 발급
    const tokens = await this.userService.issueJwtTokens(fingerprint)
    res.setHeader('Authorization', `Bearer ${tokens.accessToken}`)
    res.cookie(this.REFRESH_TOKEN_NAME, tokens.refreshToken)
  }

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

/**
 * 유저 요청사항 관련 API
 */
@UseGuards(JwtAuthGuard)
@Controller('user/needs')
export class UserNeedsController {
  constructor(private readonly userNeedsService: UserNeedsService) {}

  @Get()
  async getUserNeeds(@Req() req: RequestWithUser) {
    try {
      return await this.userNeedsService.getUserNeeds(req.user.userId)
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post()
  async createUserNeeds(
    @Req() req: RequestWithUser,
    @Body('require') require: Require,
  ) {
    try {
      return await this.userNeedsService.createUserNeeds(
        req.user.userId,
        require,
      )
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException(
          'An issue occurred during user-needs creation',
          HttpStatus.CONFLICT,
        )
      } else if (error instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException(
          'Invalid value for argument "require"',
          HttpStatus.CONFLICT,
        )
      } else if (error.status === HttpStatus.CONFLICT) {
        throw new HttpException(error.message, HttpStatus.CONFLICT)
      }
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Delete('/:userRequireId')
  async deleteUserNeeds(
    @Req() req: RequestWithUser,
    @Param('userRequireId', ParseIntPipe) userRequireId: number,
  ) {
    try {
      return await this.userNeedsService.deleteUserNeeds(
        req.user.userId,
        userRequireId,
      )
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException(
          'User-needs does not exist',
          HttpStatus.NOT_FOUND,
        )
      }
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
