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

  @Get('/station/des-route')
  async getBusStationEnd(
    @Query('startStation') startStation: string,
    @Query('endStation') endStation: string,
  ) {
    try {
      const result = await this.busService.findBusDestinationRoute(
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
    @Body('vehicleno') vehicleno: string,
    @Body('userId') userId: number,
  ) {
    try {
      return await this.busService.reserveBus(
        startStation,
        endStation,
        vehicleno,
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
