import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiService } from './api.service'

@Controller('driver')
export class ApiController {
  constructor(private readonly apiService: ApiService) {} // 이게 맞나 다시 확인

  @Get('route/:routeId/nodes/:routenm')
  async getNodesByRouteNm(
    @Param('routeId') routeId: string,
    @Param('routenm') routenm: string,
    @Query('cityCodes') cityCodes: string,
  ) {
    const cityCodesArray = cityCodes.split(',') // 쿼리 파라미터를 배열로 변환
    const nodes = await this.apiService.getNodesByRouteNm(
      routenm,
      routeId,
      cityCodesArray,
    )
    return { statusCode: 200, message: '', data: nodes } // 수정
  }

  // 도시 코드 목록을 가져오는 엔드포인트
  @Get('cityCodes')
  async getCityCodes() {
    const cityCodes = await this.apiService.getCityCodes()
    return { statusCode: 200, message: 'OK', data: cityCodes } // 수정
  }
}

///마지막에 데이터 정확하게 나오는지도 확인
