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
import { stringify } from 'querystring'

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
    const busLocationInfo = await this.nodeApiService.getBusesLocationByRouteno(
      bus.routnm,
    ) // 버스 정류장 도착 관련 정보 -> 로직은 되었고 파싱 확인 필요
    let station: {
      // id를 가지는게 좋을 듯
      currentStationId: string | null
      futureStationId: string | null
    } = {
      currentStationId: null, // 여기를 노선 처음 걸로 정해야됨
      futureStationId: null,
    }

    station = await this.checkStation(
      // 버스의 현재 위치와 다음 정류장에 대한 정보를 파악
      busLocationInfo.stopFlag,
      busLocationInfo.stId,
      station,
    )

    const futurePassengers = await this.countFuturePassengers(
      this.passengers,
      station.currentStationId,
      bus.id,
    )

    const busInfo: BoardingInfo = {
      requires: ['이건 요구사항 어떻게 받는지 모름'], // 추후 수정 필요
      Station: station, // 나중에 정류소 명으로 바꿀듯
      CurrentPassengers: this.passengers,
      futurePassengers: futurePassengers,
    }
    return busInfo
  }

  private async checkStation(stopFlag, stId, station) {
    // 여기 로직이 이게 맞나??
    if (stopFlag === 1) station.currentStationId = station.currentStationId // 1은 무조건 현재 위치, current는 현재 정류장 혹은 다음 정류장 전의 정류장
    if (stopFlag === 0) station.futureStationId = stId // 0은 가는 중 그러니까 무조건 다음 정류장
    return station
  }

  // 특정 버스의 현재 정류장 이후의 승객 수 계산
  // passenger의 current는 노선별 탑승 인원 파악용
  // passenger의 end는 하차인원 파악용
  async countFuturePassengers(
    // 위에 해결하고 하고 싶음
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

  // 버스 정류장 변화 후 callbback함수
  public startMonitoringBusLocation(
    busId: number,
    callback: (locationChanged: boolean) => void,
  ): void {
    let previousLocation: any = null

    const intervalId = setInterval(async () => {
      const busInfo = await this.getBusInfoToDriver(busId)
      let currentStationId = busInfo.Station.currentStationId
      const futureStationId = busInfo.Station.futureStationId
      if (this.hasLocationChanged(currentStationId, futureStationId)) {
        callback(true)
        clearInterval(intervalId)
      }
    }, 60000)
  }

  // 위치 변경 감지 확인 로직
  private hasLocationChanged(
    // 위에 있는거랑 비교
    currentStationId: string,
    futureStationId: string,
  ): boolean {
    return !currentStationId || currentStationId !== futureStationId
  }

  // 실시간 버스 정류장 위치 및 이전 정류장 정보 확인
  // 노선 번호 -> 같은 노선의 우

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
