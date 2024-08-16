import {
  Controller,
  Post,
  HttpException,
  HttpStatus,
  Body,
  HttpCode,
} from '@nestjs/common'
import { DriverService } from './driver.service'

@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  // code 입력 시 회사이름, id, 도시코드 반환
  @Post('code')
  async findBusCompanyIdAndCityCode(@Body('code') code: string) {
    try {
      const busCompanyInfo =
        await this.driverService.findBusCompanyIdAndCityCode(code)
      if (!busCompanyInfo) {
        throw new HttpException(
          'No company found with provided code',
          HttpStatus.NOT_FOUND,
        )
      }
      return busCompanyInfo
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post('bus-search')
  async findBusInfoByCompanyIdAndVehiclenoOrRoutnm(
    @Body('busCompanyId') busCompanyId: number,
    @Body('vehicleno') vehicleno?: string,
    @Body('routnm') routnm?: string,
  ) {
    try {
      const buses =
        await this.driverService.findBusInfoByCompanyIdAndVehiclenoOrRoutnm(
          busCompanyId,
          vehicleno,
          routnm,
        )
      if (!buses) {
        throw new HttpException(
          'No bus found with provided busInfo',
          HttpStatus.NOT_FOUND,
        )
      }
      return buses
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // 버스 아이디 반환, 버스 운행으로 상태 변경
  @Post('busId')
  async confirmOperation(
    @Body('busCompanyId') busCompanyId: number,
    @Body('vehicleno') vehicleno: string,
  ) {
    try {
      const busId = await this.driverService.confirmOperation(
        busCompanyId,
        vehicleno,
      )
      if (!busId) {
        throw new HttpException(
          'No busId information found',
          HttpStatus.NOT_FOUND,
        )
      }
      return busId
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // 버스 아이디와 도시코드로 버스 경로를 반환 - 경로가 null로 반환
  @Post('station-list')
  async findRouteByBusIdAndCityCode(
    @Body('busId') busId: number,
    @Body('cityCode') cityCode: string,
  ) {
    try {
      const routeInfo = await this.driverService.findRouteByBusIdAndCityCode(
        busId,
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

  // 버스 아이디가 있어야 변경 가능 - 로직 바뀔 수 있음
  @Post('bus-operation')
  @HttpCode(204)
  async changeOperation(
    @Body('busId') busId: number,
    @Body('vehicleno') vehicleno: string,
  ) {
    await this.driverService.changeOperation(busId, vehicleno)
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
