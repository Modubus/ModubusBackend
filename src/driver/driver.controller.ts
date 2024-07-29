import { Controller, Param, Post } from '@nestjs/common'

@Controller('driver')
export class DriverController {
  constructor() {}
  @Post('code')
  findCompanyAndBusesByCode(@Param('code') code: string) {
    return this.findCompanyAndBusesByCode(code)
  }

  @Post('bus-num')
  findRoutnmByVehicleno(@Param('vehicleno') vehicleno: string) {
    return this.findRoutnmByVehicleno(vehicleno)
  }
  // 버스 코드 받았는지 확인 ->버스가 있는지 확인-> 버스에 대한 운행 확인-> 버스 경로 정보 업데이트
}
