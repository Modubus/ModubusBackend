import { Controller, Delete, Get, Post } from '@nestjs/common'

@Controller('bus')
export class BusController {
  @Get('/:stationId') // 실시간 버스운행 정보 받아오기
  getBusOperation() {}

  @Get('/:stationId/:busId') // 탑승할 버스 정보
  getBusInf() {}
  @Delete('/:stationId/:busId') // 버스 탑승 취소하기
  cancelBus() {}
  @Post('/:stationId/:busId') // 버스 탑승 입력하기
  reserveBus() {}
}
