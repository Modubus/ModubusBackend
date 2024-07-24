import { DisableType } from '@prisma/client'
import { IsAlphanumeric, IsEmail, Length } from 'class-validator'

export class CreateUserDto {
  @IsAlphanumeric()
  @Length(4, 16)
  username!: string

  password!: string

  @IsEmail()
  email!: string

  disableType: DisableType
}
