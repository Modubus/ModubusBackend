import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class DriverService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

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

  async findRoutnmByVehicleno(vehicleno: string): Promise<string> {
    // Prisma 클라이언트를 사용하여 버스를 검색합니다.
    const bus = await this.prisma.bus.findFirst({
      where: { code: vehicleno },
    })

    if (!bus) {
      throw new NotFoundException( // 버스에 대한 정보가 없을 때
        `Bus with vehicle number ${vehicleno} not found`,
      )
    } else if (!bus.operation) {
      throw new NotAcceptableException( // 버스가 운행 중 일때
        `${vehicleno} is operated by another person`, // 변경 예정
      )
    } else {
      // 노선 데이터는 현재 더미 데이터로 반환
      // 실제로는 API를 통해 가져와야 할 수 있음
      const route = '임시 노선 데이터'
      return route
    }
  }

  async changeOperation(vehicleno: string) {
    // Prisma 클라이언트를 사용하여 버스의 운행 상태를 업데이트합니다.
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
