import {
  Controller,
  Post,
  HttpException,
  HttpStatus,
  Body,
  HttpCode,
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
      let timeoutReached = false

      const timer = setTimeout(() => {
        timeoutReached = true
        throw new HttpException('No Content', HttpStatus.NO_CONTENT) // 30초 동안 변경 사항 없으면 오류 발생
      }, 30000) // 30초 타이머

      this.driverService.subscribeToBusInfoUpdates(async () => {
        if (!timeoutReached) {
          clearTimeout(timer)
          try {
            const busInfo = await this.driverService.getBusInfo(busId)
            return busInfo // 변경 사항이 있으면 데이터를 반환
          } catch (error) {
            throw new HttpException(
              'Failed to fetch bus information',
              HttpStatus.INTERNAL_SERVER_ERROR,
            )
          }
        }
      })
    } catch (error) {
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
  /*정류장 별 탑승자 승차 정보(요구사항, 정류장별 승차, 하차 정보, 정류장별 탑승 인원 ), 현재 버스의 정류장 위치
  이렇게 탑승 정보가 바뀌면 longpolling 방식으로 데이터 반환 예정
 버스의 위치를 파악할 수 있어야함 - 정류장 위치를 통해서 버스를 파악할 예정
  */
}

/*
1. 정류장과 가까워 졌을때
2. 업데이트 될때마다 
*/
