import {
  Controller,
  Post,
  HttpException,
  HttpStatus,
  Body,
  Get,
  Query,
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
  async changeOperation(
    @Body('busId') busId: number,
    @Body('vehicleno') vehicleno: string,
  ) {
    try {
      await this.driverService.changeOperation(busId, vehicleno)
      return { message: 'Operation changed successfully' } // 성공 시 메시지 반환
    } catch (error) {
      throw new HttpException(
        'Operation could not be changed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('bus-info')
  async getBusInfo(@Query('busId') busId: number) {
    try {
      // Step 1: 버스 정보 조회
      const busInfo = await this.driverService.getBusInfoToDriver(busId)

      // Step 2: 버스 정보 유무 확인
      if (!busInfo) {
        throw new HttpException(
          'Bus information not found',
          HttpStatus.NOT_FOUND,
        )
      }

      // Step 3: 비동기적 데이터 대기 및 반환
      return new Promise((resolve, reject) => {
        // Step 4: 버스 위치 모니터링 시작 및 상태 변화 감지
        this.driverService.startMonitoringBusLocation(
          busId,
          (locationChanged) => {
            if (locationChanged) {
              resolve({ message: 'Bus location has changed' })
            }
          },
        )

        // Step 5: 승객 정보 업데이트 감지
        this.driverService.dataToPassengerUpdates((data) => {
          if (data) {
            resolve({ message: 'Passenger data has been updated' })
          } else {
            reject(
              new HttpException('No data available', HttpStatus.NO_CONTENT),
            )
          }
        })
      })
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
