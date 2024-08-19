import { Request } from 'express'
import { AuthenticatedUser } from './authenticated-user.class'

export class RequestWithUser extends Request {
  user: AuthenticatedUser
}
