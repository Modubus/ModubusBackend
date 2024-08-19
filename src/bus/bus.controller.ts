import { BusService } from './bus.service'
import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common'

@Controller('bus')
export class BusController {
  constructor(private readonly busService: BusService) {}

  @Get('/station/start') // 실시간 버스운행 정보 받아오기 api 사용
  async getBusStationStart(@Query('startStation') startStation: string) {
    try {
      return await this.busService.getBusStationStart(startStation)
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get('/station/end')
  async getBusStationEnd(
    @Query('startStation') startStation: string,
    @Query('endStation') endStation: string,
  ) {
    try {
      const result = await this.busService.getBusStationEnd(
        startStation,
        endStation,
      )
      console.log('Final result:', result)

      return result
    } catch (error) {
      console.error('Error in getBusStationEnd:', error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  // 내일 계발 예정(driver/busInfo polling or ws 방식 데이터와 함께)
  @Get('/stationId')
  async getBusInf(
    @Query('routeno') routeno: string,
    @Query('startStation') startStation: string,
  ) {
    try {
      return await this.busService.getBusInfo(routeno, startStation)
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('/stationId') // 버스 탑승 입력하기
  async reserveBus(@Query('routeno') routeno: string) {
    try {
      //return await this.busService.reserveBus()
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
  @Delete('/stationId') // 버스 탑승 취소하기
  async cancelBus(@Query('routeno') routeno: string) {
    try {
      //return await this.busService.cancelBus()
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
