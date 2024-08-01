import { Body, Controller, Param, Post } from '@nestjs/common'

@Controller('driver')
export class DriverController {
  constructor() {}
  @Post('code: code')
  async findCompanyAndBusesByCode(@Param('code') code: string) {
    return this.findCompanyAndBusesByCode(code)
  }

  @Post('bus-num: vehicleno')
  async findRoutnmByVehicleno(@Param('vehicleno') vehicleno: string) {
    // body가 맞나 param이 맞나
    return this.findRoutnmByVehicleno(vehicleno)
  }
  // 버스 코드 받았는지 확인 ->버스가 있는지 확인-> 버스에 대한 운행 확인-> 버스 경로 정보 업데이트
  // @Post('bus-end') -> 버스 경로가 필요할줄 알았는데 그냥 버스 기사가 누르면 종료되게 하는게 좋을 듯 왜냐하면 버스 경로 중간에 기사가 바뀌는 경우도 있으니까
  @Post('bus-end: vehicleno')
  async changeOperation(@Param('vehicleno') vehicleno: string) {
    return this.changeOperation(vehicleno)
  }
}
