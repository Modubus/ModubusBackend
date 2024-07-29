import { Injectable } from '@nestjs/common'
import { lastValueFrom } from 'rxjs'
import { HttpService } from '@nestjs/axios'
import * as dotenv from 'dotenv'

dotenv.config({ path: './.env.development' })

@Injectable()
export class ApiService {
  private readonly apiUrl: string

  constructor(private readonly httpService: HttpService) {
    const API_KEY = process.env.API_KEY
    const API_URL = process.env.API_URL
    this.apiUrl = `${API_URL}?serviceKey=${API_KEY}&pageNo=1&numOfRows=10&_type=json&cityCode=25&routeId=DJB30300052`
  }

  async getBusRouteData(): Promise<any> {
    const response = await lastValueFrom(
      this.httpService.get(this.apiUrl, { timeout: 5000 }),
    )
    return response.data
  }
}
