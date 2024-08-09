import {
  Controller,
  Get,
  Post,
  HttpException,
  HttpStatus,
  Body,
  Query,
  HttpCode,
} from '@nestjs/common'
import { DriverService } from './driver.service'

@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post('code')
  async findCompanyAndBusesByCode(@Body('code') code: string) {
    try {
      const companyData = await this.driverService.findCompanyAndBusesByCode(
        code,
      )
      if (!companyData) {
        throw new HttpException(
          'No company found with provided code',
          HttpStatus.NOT_FOUND,
        )
      }
      return companyData
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('bus-num')
  async checkBusNumber(@Query('vehicleno') vehicleno: string) {
    try {
      const busData = await this.driverService.checkBusNumber(vehicleno)
      if (!busData) {
        throw new HttpException(
          'No bus found with provided vehicle number',
          HttpStatus.NOT_FOUND,
        )
      }
      return busData
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('station-list')
  async findRoutnmByVehicleno(
    @Query('vehicleno') vehicleno: string,
    @Query('cityCode') cityCode: string,
  ) {
    try {
      const routeInfo = await this.driverService.findRoutnmByVehicleno(
        vehicleno,
        cityCode,
      )
      if (!routeInfo) {
        throw new HttpException(
          'No route information found',
          HttpStatus.NOT_FOUND,
        )
      }
      return routeInfo
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post('bus-operation')
  @HttpCode(204)
  async changeOperation(@Body('vehicleno') vehicleno: string) {
    await this.driverService.changeOperation(vehicleno)
  }
  /*
  @Get('bus-info')
  async getBusInfo() {
    try {
      const busInfo = await this.driverService.getBusInfo()
      if (!busInfo) {
        throw new HttpException(
          'Bus information is currently unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        )
      }
      return busInfo
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
  */
}
