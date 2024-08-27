import {
  Injectable,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { NodeApiService } from '../api/node-api/node-api.service'
import { HttpService } from '@nestjs/axios'
import { Passenger } from './Dto/passengers'
import { BoardingInfo } from './Dto/boardingInfo'

@Injectable()
export class DriverService {
  private prisma: PrismaClient
  private nodeApiService: NodeApiService
  private passengersCallback: Array<(passengers: Passenger[]) => void> = []
  private passengers: Passenger[] = []

  constructor() {
    this.prisma = new PrismaClient()
    const httpService = new HttpService()
    this.nodeApiService = new NodeApiService(httpService)
  }

  // 1. 버스회사 코드 입력 -> 회사id와 도시코드를 반환
  async findBusCompanyIdAndCityCode(code: string) {
    const busCompanyInfo = await this.prisma.busCompany.findFirst({
      where: { code },
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
    if (!vehicleno && !routnm) {
      throw new HttpException('vehicleno or routnm must be provided', 400)
    }

    const buses = await this.prisma.bus.findMany({
      where: {
        busCompanyId,
        OR: [{ vehicleno }, { routnm }],
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

    return busInfoList
  }

  // 3. 회사 아이디, 차량번호 입력 -> 운행상태확인 -> 버스의 id 반환
  async confirmOperation(busCompanyId: number, vehicleno: string) {
    const bus = await this.prisma.bus.findFirst({
      where: { busCompanyId, vehicleno },
    })

    if (bus?.operation) {
      throw new ConflictException(
        'The bus is currently operating, please select another bus',
      )
    }

    await this.changeOperation(bus.id, bus.vehicleno)
    return { busId: bus.id }
  }

  // 4. 버스 id -> 노선번호 -> 노선 아이디 -> 노선 경로
  async findRouteByBusIdAndCityCode(busId: number, cityCode: string) {
    const bus = await this.prisma.bus.findFirst({
      where: { id: busId },
    })

    if (!bus) {
      throw new NotFoundException('Bus not found')
    }

    const routes = await this.nodeApiService.getRouteDetails(
      bus.routnm,
      cityCode,
    )
    return routes
  }

  // 버스 운행 상태 변경
  async changeOperation(busId: number, vehicleno: string) {
    const bus = await this.prisma.bus.findFirst({
      where: { id: busId, vehicleno },
    })

    if (!bus) {
      throw new NotFoundException(
        `Bus with vehicle number ${vehicleno} not found`,
      )
    }

    const updatedBus = await this.prisma.bus.update({
      where: { id: bus.id },
      data: { operation: !bus.operation },
    })

    return updatedBus
  }

  // longPolling 방식으로 기사에게 정보 업데이트
  async getBusInfoToDriver(busId: number): Promise<BoardingInfo> {
    const bus = await this.prisma.bus.findUnique({
      where: { id: busId },
    })
    if (!bus) {
      throw new NotFoundException('Bus information is currently unavailable')
    }
    const currentStation = await this.currentBusLocation(bus.id)
    const futurePassengers = await this.countFuturePassengers(
      this.passengers,
      currentStation,
      bus.id,
    )
    const busInfo: BoardingInfo = {
      requires: ['이건 요구사항 어떻게 받는지 모름'], // 추후 수정 필요
      currentStation: currentStation,
      CurrentPassengers: this.passengers,
      futurePassengers: futurePassengers,
    }
    return busInfo
  }

  // 특정 버스의 현재 정류장 이후의 승객 수 계산
  async countFuturePassengers(
    passengers: Passenger[],
    currentStation: string,
    busId: number,
  ): Promise<any> {
    const bus = await this.prisma.bus.findUnique({
      where: { id: busId },
      include: { busCompany: true },
    })

    if (!bus) throw new Error('Bus not found')
    if (!bus.busCompany) throw new Error('Bus company information is missing')

    const stopsInfo = await this.nodeApiService.getRouteDetails(
      bus.routnm,
      bus.busCompany.cityCode,
    )
    const stops = stopsInfo.stops

    const currentStationIndex = stops.indexOf(currentStation)
    if (currentStationIndex === -1) {
      throw new Error(
        `Current station ${currentStation} not found in the route.`,
      )
    }

    const futureStops = stops.slice(currentStationIndex + 1)
    const passengerCounts = futureStops
      .map((stop) => ({
        stop,
        count: passengers.filter((p) => p.startStation === stop).length,
      }))
      .filter((stopCount) => stopCount.count > 0)

    return passengerCounts
  }

  //  return {
  //  stopFlag: stopFlag,
  //  stId: stId,
  //} //지난 정류장과 같은 정류장인데 stopFlag0이면 아직 운행 중, 지난 정류장과 같은 이름인데 stopFlag1이면 도착, 지난 정류장과 다른 이름인데 stopFlag0이면 출발

  public startMonitoringBusLocation(
    busId: number,
    callback: (locationChanged: boolean) => void,
  ): void {
    let previousLocation: any = null

    const intervalId = setInterval(async () => {
      const currentLocation = await this.currentBusLocation(busId)
      if (this.hasLocationChanged(previousLocation, currentLocation)) {
        callback(true)
        clearInterval(intervalId)
      }
      previousLocation = currentLocation
    }, 60000)
  }

  // 위치 변경 감지
  private hasLocationChanged(
    previousLocation: any,
    currentLocation: any,
  ): boolean {
    return (
      !previousLocation ||
      previousLocation.stopId !== currentLocation.stopId ||
      previousLocation.stopFlag !== currentLocation.stopFlag
    )
  }

  // 실시간 버스 정류장 위치 및 이전 정류장 정보 확인
  // 노선 번호 -> 같은 노선의 우
  private async currentBusLocation(busId: number): Promise<any> {
    const bus = await this.prisma.bus.findUnique({
      where: { id: busId },
    })
    const buses = await this.nodeApiService.getBusesLocationByRouteno(
      bus.routnm,
    )
    const vehicleInfo = buses.find((b) => b.vehicleno === bus.vehicleno)

    const vehicleId = parseInt(vehicleInfo.vehId)
    const busLocationInfo = this.nodeApiService.getBusInfoByVehId(vehicleId)
    return busLocationInfo // 정류소 id, 정류소 도착 정보, 실시간 위치 정보
  }

  // 탑승자 변경 사항 알림
  async notifyToDriverUpdates(userId: number) {
    await this.getPassengersFromDB(userId)

    this.passengersCallback.forEach((callback) => {
      callback(this.passengers)
    })
  }

  // DB에서 최신 승객 데이터를 가져오기
  async getPassengersFromDB(userId: number) {
    const passengers = await this.prisma.boarding.findMany({
      where: { userId },
      include: {
        user: true, // 유저 정보를 포함시켜 Passenger 객체를 완성
      },
    })

    this.passengers = passengers.map((boarding) => ({
      userId: boarding.userId,
      startStation: boarding.startStation,
      endStation: boarding.endStation,
    }))
  }

  // 탑승자 변경 사항 알림 등록
  dataToPassengerUpdates(callback: (passengers: Passenger[]) => void) {
    this.passengersCallback.push(callback)
  }
}
