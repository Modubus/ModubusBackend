import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { Logger } from '@nestjs/common'

@Catch()
export class UncaughtExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(UncaughtExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    this.logger.error(
      `HTTP Status: ${status} Error Message: ${this.getErrorMessage(
        exception,
      )}`,
      exception instanceof Error ? exception.stack : '',
    )

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: this.getErrorMessage(exception),
    })
  }

  private getErrorMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      return exception.message
    }
    if (exception instanceof Error) {
      return exception.message
    }
    return 'Unexpected error occurred'
  }
}
