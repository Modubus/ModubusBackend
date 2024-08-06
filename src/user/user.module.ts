import { Module } from '@nestjs/common'
import {
  UserController,
  UserFavoriteController,
  UserNeedsController,
} from './user.controller'
import {
  UserFavoriteService,
  UserNeedsService,
  UserService,
} from './user.service'
import { JwtModule } from '@nestjs/jwt'
import { JwtStrategy } from 'src/lib/strategy/jwt.strategy'
import { JwtAuthGuard } from 'src/lib/guard/jwt-auth.guard'

@Module({
  controllers: [UserController, UserFavoriteController, UserNeedsController],
  providers: [
    UserService,
    UserFavoriteService,
    UserNeedsService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '10m' }, // default value
    }),
  ],
})
export class UserModule {}
