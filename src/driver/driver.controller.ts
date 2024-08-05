import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
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
  async checkBusNumber(@Body('vehicleno') vehicleno: string) {
    try {
      return await this.driverService.checkBusNumber(vehicleno)
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('bus-end')
  async changeOperation(@Body('vehicleno') vehicleno: string) {
    return this.driverService.changeOperation(vehicleno)
  }

  @Get('station-list')
  async findRoutnmByVehicleno(@Body('vehicleno') vehicleno: string) {
    try {
      return await this.driverService.findRoutnmByVehicleno(vehicleno)
    } catch (error) {
      console.log(error)
      throw new HttpException('Unknown Error', HttpStatus.INTERNAL_SERVER_ERROR)
    }
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
