import { Controller, Get, Param, Query } from '@nestjs/common'
import { BusStopApiService } from './bus-stop-api.service'

@Controller('driver')
export class ApiController {
  constructor(private readonly busStopApiService: BusStopApiService) {} // 이게 맞나 다시 확인
}

///마지막에 데이터 정확하게 나오는지도 확인
