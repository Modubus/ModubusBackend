import {
  ConflictException,
  HttpException,
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

  // 1. 버스회사 코드 입력 -> 회사id와 도시코드를 반환
  async findBusCompanyIdAndCityCode(code: string) {
    const busCompanyInfo = await this.prisma.busCompany.findFirst({
      where: { code: code },
      select: { name: true, id: true, cityCode: true },
    })
    return busCompanyInfo
  }
  // 2. 버스회사 아이디 and (버스 차량번호 or 노선번호)를 통해 관련있는 모든 버스 반환
  async findBusInfoByCompanyIdAndVehiclenoOrRoutnm(
    busCompanyId: number,
    vehicleno?: string,
    routnm?: string,
  ) {
    if (vehicleno === undefined && routnm === undefined) {
      throw new HttpException('vehicleno or routnm must be provided', 400)
    }

    // 버스 정보 접근
    const buses = await this.prisma.bus.findMany({
      where: {
        busCompanyId: busCompanyId,
        OR: [{ vehicleno: vehicleno }, { routnm: routnm }],
      },
      select: {
        vehicleno: true,
        routnm: true,
        busCompany: {
          select: {
            cityCode: true,
          },
        },
      },
    })

    if (buses.length === 0) {
      throw new HttpException('No bus found with the provided criteria', 404)
    }

    // 각 버스에 대해 startEndNode 정보를 가져오고, bus 정보와 함께 반환
    const busInfoList = await Promise.all(
      buses.map(async (bus) => {
        const startEndNode = await this.nodeApiService.getStartEndNodeByRouteNo(
          bus.routnm,
          bus.busCompany.cityCode,
        )

        return {
          vehicleno: bus.vehicleno,
          routnm: bus.routnm,
          cityCode: bus.busCompany.cityCode,
          startnodenm: startEndNode.startnodenm,
          endnodenm: startEndNode.endnodenm,
        }
      }),
    )

    return busInfoList // 모든 관련 버스 정보를 배열로 반환
  }

  // 각 노선별 다른 차량 번호 존재 -> 차량 실제 번호를 받음
  //3. 회사 아이디, 차량번호 입력 -> 운행상태확인 -> 버스의 id 반환
  async confirmOperation(busCompanyId: number, vehicleno: string) {
    const bus = await this.prisma.bus.findFirst({
      where: { busCompanyId: busCompanyId, vehicleno: vehicleno },
    })

    // 버스 운행여부 확인 후 변경
    if (bus.operation) {
      throw new ConflictException(
        'The bus is currently operating, please select another bus',
      )
    }
    this.changeOperation(bus.id, bus.vehicleno)
    const busId = {
      busId: bus.id,
    }
    return busId

  // busId -> 노선 번호를 찾는다 // prisma 검색
  // 노선 번호로 -> 노선 아이디를 찾는다 // node-api 검색
  // 노선 아이디로 -> 노선 정보를 찾는다 // node-api 검색
  // 상행 하행 여부 확인x 상행하행 데이터 전부 반환

  // 4. 버스 id -> 노선번호 -> 노선 아이디 -> 노선 경로
  async findRouteByBusIdAndCityCode(busId: number, cityCode: string) {
    // Prisma 사용하여 버스를 검색합니다.
    const bus = await this.prisma.bus.findFirst({
      // 버스실제 번호랑 버스 차량 번호
      where: { id: busId },
    })
    if (!bus) {
      throw new NotFoundException(`Bus not found`)
    }
    // 노선 데이터를 API를 통해 가져옵니다.
    const routnm = await this.nodeApiService.getRouteDetails(
      bus.routnm,
      cityCode,
    )
    return routnm
  }

  // 버스 운행x, 운행o 변경
  async changeOperation(busId: number, vehicleno: string) {
    // Prisma를 사용하여 버스를 검색합니다.
    const bus = await this.prisma.bus.findFirst({
      where: { id: busId, vehicleno: vehicleno },
    })

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
  // 운행하려는 버스가 있음을 확인 - 이걸 어디에 사용하지?
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
}
