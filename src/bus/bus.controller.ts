import { BusService } from './bus.service'
import {
  Body,
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
  @Get('/station')
  async getBusInfoToUser(
    @Query('routeno') routeno: string,
    @Query('startStation') startStation: string,
  ) {
    try {
      return await this.busService.getBusInfoToUser(routeno, startStation)
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('/station')
  async reserveBus(
    @Body('startStation') startStation: string,
    @Body('endStation') endStation: string,
    @Body('routeno') routeno: string,
    @Body('userId') userId: number,
  ) {
    try {
      return await this.busService.reserveBus(
        startStation,
        endStation,
        routeno,
        userId,
      )
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Delete('/station')
  async cancelBus(@Body('userId') userId: number) {
    try {
      return await this.busService.cancelBus(userId)
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}

// 