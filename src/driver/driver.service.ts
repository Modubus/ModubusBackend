import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { NodeApiService } from '../api/node-api/node-api.service'
import { HttpService } from '@nestjs/axios'

@Injectable()
export class DriverService {
  private prisma: PrismaClient
  private nodeApiService: NodeApiService

  constructor() {
    this.prisma = new PrismaClient()
    const httpService = new HttpService() // HttpService 인스턴스 생성
    this.nodeApiService = new NodeApiService(httpService) // NodeApiService 인스턴스 생성
  }

  // 버스코드에 대한 회사 유무 확인 -> 버스회사의 정보를 반환
  async findCompanyAndBusesByCode(code: string) {
    const busCompany = await this.prisma.busCompany.findFirst({
      where: { code: code },
      select: {
        name: true, // 회사 이름
        Bus: {
          select: {
            vehicleno: true, // 버스의 차량 번호
            routnm: true, // 버스의 노선 이름
          },
        },
      },
    })
    if (!busCompany) {
      throw new NotFoundException(`Bus company with code ${code} not found`)
    }
    return busCompany
  }

  // 운행하려는 버스가 있음을 확인
  async checkBusNumber(vehicleno: string) {
    const bus = await this.prisma.bus.findFirst({
      where: { vehicleno: vehicleno },
    })
    if (!bus) {
      throw new NotFoundException(
        `Bus with vehicle number ${vehicleno} not found`,
      ) // 운행 여부 확인
    }

    return { message: `Bus with vehicle number ${vehicleno} found.` }
  }

  // 1번 차량번호 -> 노선 번호를 찾는다 // prima 검색
  // 노선 번호로 -> 노선 아이디를 찾는다 // node-api 검색
  // 노선 아이디로 -> 노선 정보를 찾는다 // node-api 검색
  // 상행 하행 여부 확인x 상행하행 데이터 전부 반환

  // 버스 차량번호 -> 노선번호 -> 노선 아이디 -> 노선 경로
  async findRoutnmByVehicleno(vehicleno: string, cityCode: string) {
    // Prisma 사용하여 버스를 검색합니다.
    const bus = await this.prisma.bus.findFirst({
      // 버스실제 번호랑 버스 차량 번호
      where: { vehicleno: vehicleno },
    })
    if (!bus) {
      throw new NotFoundException(
        `Bus with vehicle number ${vehicleno} not found`,
      )
    } else if (bus.operation === true) {
      throw new NotAcceptableException(
        `${vehicleno} is operated by another person`,
      )
    } else {
      // 노선 데이터를 API를 통해 가져옵니다.
      const routnm = await this.nodeApiService.getRouteDetails(
        bus.routnm,
        cityCode,
      )
      return routnm
    }
  }

  // 버스 운행x, 운행o 변경
  async changeOperation(vehicleno: string) {
    console.log('v:', vehicleno)

    // Prisma를 사용하여 버스를 검색합니다.
    const bus = await this.prisma.bus.findFirst({
      where: { vehicleno: vehicleno },
    })

    console.log('bus:', bus)

    if (!bus) {
      console.log(`Bus with vehicle number ${vehicleno} not found`)
      throw new NotFoundException(
        `Bus with vehicle number ${vehicleno} not found`,
      )
    }

    // 버스의 현재 운행 상태를 반전시킵니다.
    const updatedBus = await this.prisma.bus.update({
      where: { id: bus.id },
      data: { operation: !bus.operation },
    })

    console.log(
      `Bus with vehicle number ${vehicleno} operation status updated to ${!bus.operation}`,
    )
    return updatedBus
  }
}
