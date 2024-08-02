import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { NodeApiService } from '../api/node-api/node-api.service'
import { HttpService, HttpModule } from '@nestjs/axios'
import { lastValueFrom } from 'rxjs'

@Injectable()
export class DriverService {
  private prisma: PrismaClient
  private nodeApiService: NodeApiService

  constructor() {
    this.prisma = new PrismaClient()
    const httpService = new HttpService() // HttpService 인스턴스 생성
    this.nodeApiService = new NodeApiService(httpService) // NodeApiService 인스턴스 생성
  }

  // 버스코드에 대한 회사 존재 유무 확인 -> 버스회사의 버스 정보를 업데이트
  async findCompanyAndBusesByCode(code: string) {
    const busCompany = await this.prisma.busCompany.findFirst({
      where: { Bus: { some: { code } } },
      include: {
        Bus: true,
      },
    })

    if (!busCompany) {
      throw new NotFoundException(`Bus company with code ${code} not found`)
    }

    return busCompany
  }

  async checkBusNumber(vehicleno: string) {
    const bus = await this.prisma.bus.findFirst({
      where: { code: vehicleno },
    })

    if (!bus) {
      throw new NotFoundException(
        `Bus with vehicle number ${vehicleno} not found`,
      )
    }

    return { message: `Bus with vehicle number ${vehicleno} found.` }
  }

  async findRoutnmByVehicleno(vehicleno: string): Promise<string> {
    // Prisma 사용하여 버스를 검색합니다.
    const bus = await this.prisma.bus.findFirst({
      where: { code: vehicleno },
    })

    if (!bus) {
      throw new NotFoundException(
        `Bus with vehicle number ${vehicleno} not found`,
      )
    } else if (!bus.operation) {
      throw new NotAcceptableException(
        `${vehicleno} is operated by another person`,
      )
    } else {
      // 노선 데이터를 API를 통해 가져옵니다.
      const cityCode = '25' // 대전 // 도시 코드가 필요해서 사용자 위치에 맞는 도시코드를 찾아올 방법 추후에 생각 예정
      const routeDetails = await this.nodeApiService.getRouteDetails(
        bus.code,
        cityCode,
      )
      return routeDetails.join(', ') // 경로 데이터를 문자열로 반환합니다.
    }
  }

  async changeOperation(vehicleno: string) {
    // Prisma를 사용하여 버스의 운행 상태를 업데이트합니다.
    const bus = await this.prisma.bus.findFirst({
      where: { code: vehicleno },
    })

    if (!bus) {
      throw new NotFoundException(
        `Bus with vehicle number ${vehicleno} not found`,
      )
    }

    await this.prisma.bus.update({
      where: { id: bus.id },
      data: { operation: !bus.operation },
    })
  }
}
