import { Controller, Get } from '@nestjs/common'
import { ApiService } from './api.service'

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('/data') // check용
  async getData() {
    const data = await this.apiService.getBusRouteData()
    return data
  }
}
