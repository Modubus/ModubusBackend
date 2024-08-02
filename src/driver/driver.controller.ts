import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { DriverService } from './driver.service'

@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}
  @Post('code/:code')
  async findCompanyAndBusesByCode(@Param('code') code: string) {
    return this.driverService.findCompanyAndBusesByCode(code)
  }

  @Post('bus-num/:vehicleno')
  async checkBusNumber(@Body('vehicleno') vehicleno: string) {
    return this.driverService.checkBusNumber(vehicleno)
  }
  // 버스 코드 받았는지 확인 ->버스가 있는지 확인-> 버스에 대한 운행 확인-> 버스 경로 정보 업데이트
  @Post('bus-end/:vehicleno')
  async changeOperation(@Param('vehicleno') vehicleno: string) {
    return this.driverService.changeOperation(vehicleno)
  }

  @Get('/driver/station-list')
  async findRoutnmByVehicleno(@Param('vehicleno') vehicleno: string) {
    // body가 맞나 param이 맞나
    return this.driverService.findRoutnmByVehicleno(vehicleno)
  }

  @Get('/driver/bus-info')
  getBusInfo() {}
}
