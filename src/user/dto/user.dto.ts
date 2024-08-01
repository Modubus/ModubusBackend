import { DisableType } from '@prisma/client'
import { IsAlphanumeric, IsEmail, IsOptional, Length } from 'class-validator'

export class CreateUserDto {
  @IsAlphanumeric()
  @Length(4, 16)
  username!: string

  password!: string

  @IsEmail()
  email!: string

  disableType: DisableType
}

export class UpdateUserDto {
  @IsOptional()
  @IsAlphanumeric()
  @Length(4, 16)
  username?: string

  @IsOptional()
  password?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  disableType?: DisableType
}

export class LoginUserDto {
  @IsAlphanumeric()
  @Length(4, 16)
  username!: string

  password!: string
}
