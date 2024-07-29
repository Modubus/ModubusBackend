import { Bus } from './Types/bus'
import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class BusCompanyService {
  constructor(private prisma: PrismaClient) {}
  // 코드에 대한 회사 존재 유무 확인 -> 버스회사의 버스 정보를 업데이트
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

  private buses: Bus[] = [
    {
      id: 1,
      routnm: '92-1',
      vehicleno: '30가 1101',
      operation: true,
    },
    {
      id: 2,
      routnm: '100',
      vehicleno: '40가 2202',
      operation: false,
    },
  ]

  async findRoutnmByVehicleno(vehicleno: string): Promise<string> {
    const bus = this.buses.find((bus) => bus.vehicleno === vehicleno)
    if (!bus) {
      throw new NotFoundException( // 버스에 대한 정보가 없을 때
        `Bus with vehicle number ${vehicleno} not found`,
      )
    } else if (!bus.operation) {
      throw new NotAcceptableException( // 버스가 운행 중 일때
        `${vehicleno} is operated by another person`, // 변경 예정
      )
    }
    return bus.routnm
  }
}
