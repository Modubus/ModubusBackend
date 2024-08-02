import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiService } from './api.service'

@Controller('driver')
export class ApiController {
  constructor(private readonly apiService: ApiService) {} // 이게 맞나 다시 확인

  // 도시 코드 목록을 가져오는 엔드포인트
  @Get('cityCodes')
  async getCityCodes() {
    const cityCodes = await this.apiService.getCityCodes()
    return { statusCode: 200, message: 'OK', data: cityCodes } // 수정
  }
}

///마지막에 데이터 정확하게 나오는지도 확인
