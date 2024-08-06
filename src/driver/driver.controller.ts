import {
  Controller,
  Get,
  Post,
  HttpException,
  HttpStatus,
  Body,
  Query,
} from '@nestjs/common'
import { DriverService } from './driver.service'

@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post('code')
  async findCompanyAndBusesByCode(@Body('code') code: string) {
    try {
      return await this.driverService.findCompanyAndBusesByCode(code)
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get('bus-num')
  async checkBusNumber(@Query('vehicleno') vehicleno: string) {
    try {
      const result = await this.driverService.checkBusNumber(vehicleno)
      return result
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get('station-list')
  async findRoutnmByVehicleno(
    @Query('vehicleno') vehicleno: string,
    @Query('cityCode') cityCode: string, // 입력 받을지 code를 받을때 자동으로 사용자가 가지고 있을지 생각해야함
  ) {
    try {
      const result = await this.driverService.findRoutnmByVehicleno(
        vehicleno,
        cityCode,
      )
      return result
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('bus-end')
  async changeOperation(@Body('vehicleno') vehicleno: string) {
    return this.driverService.changeOperation(vehicleno)
  }

  // 추후에 개발 예정
  @Get('bus-info')
  async getBusInfo() {
    try {
      //return await this.driverService.getBusInfo()
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
