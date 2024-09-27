import {
  Injectable,
  ConflictException,
  HttpException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { Passenger } from './Dto/passengers'
import { BoardingInfo } from './Dto/boardingInfo'
import { BusCompanyInfo } from './Dto/busCompanyInfo'
import { BusInfo } from './Dto/busInfo'
import { OperationConfirmation } from './Dto/operationConfirmation'
import { NodeApiService } from 'src/api/node-api/node-api.service'
import { Route } from 'src/api/node-api/Dto/route'

@Injectable()
export class DriverService {
  private passengersCallback: Array<(passengers: Passenger[]) => void> = []
  private passengers: Passenger[] = []
  private previousStationId: string | null = null
  private stationInfo: {
    currentStationId: string | null
    futureStationId: string | null
  } = null

  constructor(
    private readonly prisma: PrismaClient, // DI로 PrismaClient 주입
    private readonly nodeApiService: NodeApiService, // DI로 NodeApiService 주입
  ) {}

  // 1. 버스회사 코드 입력 -> 회사id와 도시코드를 반환
  async findBusCompanyIdAndCityCode(code: string): Promise<BusCompanyInfo> {
    return (await this.prisma.busCompany.findFirst({
      where: { code },
      select: { name: true, id: true, cityCode: true },
    })) as BusCompanyInfo
  }

  // 2. 버스회사 아이디 and (버스 차량번호 or 노선번호)를 통해 관련있는 모든 버스 반환
  async findBusInfoByCompanyIdAndVehiclenoOrRoutnm(
    busCompanyId: number,
    vehicleno?: string,
    routnm?: string,
  ): Promise<BusInfo[]> {
    const buses = await this.prisma.bus.findMany({
      where: {
        busCompanyId,
        OR: [{ vehicleno }, { routnm }],
      },
      include: {
        busCompany: {
          select: {
            cityCode: true,
          },
        },
      },
    })

    if (buses.length === 0) {
      throw new NotFoundException('No bus found with the provided criteria')
    }

    return buses.map((bus) => ({
      vehicleno: bus.vehicleno,
      routnm: bus.routnm,
      cityCode: bus.busCompany.cityCode,
    }))
  }

  // 3. 회사 아이디, 차량번호 입력 -> 운행상태확인 -> 버스의 id 반환
  async confirmOperation(
    busCompanyId: number,
    vehicleno: string,
  ): Promise<OperationConfirmation> {
    const bus = await this.prisma.bus.findFirst({
      where: { busCompanyId, vehicleno },
      select: { operation: true, id: true },
    })

    if (!bus) {
      throw new NotFoundException('Bus not found')
    }

    if (bus.operation) {
      throw new ConflictException(
        'The bus is currently operating, please select another bus',
      )
    }

    return { busId: bus.id }
  }

  // 4. 버스 id -> 노선번호 -> 노선 아이디 -> 노선 경로
  async findRouteByBusIdAndCityCode(
    busId: number,
    cityCode: string,
  ): Promise<Route> {
    const bus = await this.prisma.bus.findFirst({
      where: { id: busId },
      select: { routnm: true },
    })

    if (!bus) {
      throw new NotFoundException('Bus not found')
    }

    const routes: Route = await this.nodeApiService.getRouteDetails(
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
    try {
      const bus = await this.prisma.bus.findUnique({
        where: { id: busId },
      })
      if (!bus) {
        throw new NotFoundException('Bus information is currently unavailable')
      }

      // 버스 위치 정보를 가져오는 로직
      const busLocationInfo =
        await this.nodeApiService.getBusesLocationByRouteno(
          bus.routnm,
          bus.vehicleno,
        )
      if (!busLocationInfo) {
        throw new NotFoundException(
          'No location information available for the bus',
        )
      }

      const routeDetail = await this.nodeApiService.getRouteDetails(
        bus.routnm,
        '21',
      )
      // 초기 정류장 정보를 설정
      if (this.stationInfo === null) {
        this.stationInfo = {
          currentStationId: routeDetail.stops[0].stationId,
          futureStationId: null,
        }
      }
      // 현재 위치와 다음 정류장 정보를 업데이트
      this.stationInfo = await this.checkStation(
        busLocationInfo[0].stopFlag,
        busLocationInfo[0].stId,
        routeDetail,
        this.stationInfo,
      )

      // 미래 탑승자 수 파악
      const upcomingPassengers = await this.countFuturePassengers(
        this.stationInfo.currentStationId!,
        bus.id,
      )
      // 반환할 버스 정보 구성
      const busInfo: BoardingInfo = {
        station: this.stationInfo,
        passengers: this.passengers,
        upcomingPassengers: upcomingPassengers,
      }

      return busInfo
    } catch (error) {
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // 정류장 정보 확인 로직
  private async checkStation(
    stopFlag: string,
    stId: string,
    routeDetail,
    station: {
      currentStationId: string | null
      futureStationId: string | null
    },
  ): Promise<{
    currentStationId: string | null
    futureStationId: string | null
  }> {
    if (stopFlag === '1') {
      // 현재 정류장에 도착했을 경우
      station.currentStationId = stId
      station.futureStationId = this.getNextStationId(stId, routeDetail)
    } else if (stopFlag === '0') {
      // 다음 정류장으로 향하는 중일 경우
      station.currentStationId = station.futureStationId
      station.futureStationId = this.getNextStationId(
        station.currentStationId,
        routeDetail,
      )
    }

    return station
  }

  // 다음 정류장 ID를 가져오는 메서드
  private getNextStationId(currentStationId: string, routeDetail): string {
    const currentIndex = routeDetail.stops.findIndex(
      (stop) => stop.stationId === currentStationId,
    )
    if (currentIndex !== -1 && currentIndex < routeDetail.stops.length - 1) {
      const nextStation = routeDetail.stops[currentIndex + 1].stationId
      return nextStation
    } else if (currentIndex === routeDetail.stops.length - 1) {
      throw new Error('This is the last station in the route.')
    } else {
      throw new Error(`Station with ID ${currentStationId} not found.`)
    }
  }

  // 버스 위치 정보의 변경을 모니터링하는 함수
  public startMonitoringBusLocation(
    busInfo,
    callback: (locationChanged: boolean) => void,
  ): void {
    // 초기 실행 시 이전 정류장 ID를 설정
    if (this.previousStationId === null) {
      this.previousStationId = busInfo.station.currentStationId
    }

    const intervalId = setInterval(async () => {
      const currentStationId = busInfo.station.currentStationId

      // 이전 정류장 값과 현재 정류장 값을 비교
      if (this.hasLocationChanged(this.previousStationId, currentStationId)) {
        callback(true)
        clearInterval(intervalId)
      } else {
        // 이전 정류장을 현재 정류장으로 업데이트
        this.previousStationId = currentStationId
      }
    }, 5000) // 5초마다 polling
  }

  // 위치 변경 여부 확인 로직
  private hasLocationChanged(
    previousStationId: string | null,
    currentStationId: string | null,
  ): boolean {
    return previousStationId !== currentStationId
  }

  // 특정 버스의 현재 정류장 이후의 승객 수 계산
  async countFuturePassengers(currentStationId: string, busId: number) {
    // 버스 정보 조회
    const bus = await this.prisma.bus.findUnique({
      where: { id: busId },
      include: { busCompany: true },
    })

    const busRouteInfo = await this.nodeApiService.getRouteDetails(
      bus.routnm,
      bus.busCompany.cityCode,
    )
    const stops = busRouteInfo.stops
    const currentStationIndex = stops.findIndex(
      (stop) => stop.stationId === currentStationId,
    )

    // 앞으로 갈 정류장 분리
    const futureStops = stops.slice(currentStationIndex + 1)
    return futureStops.map((stop) => {
      return {
        station: stop.nodenm,
        stationId: stop.stationId,
      }
    })
  }

  // 탑승자 변경 사항 알림
  async notifyToDriverUpdates(userId: number) {
    // 출발지 예정지 전 정류장, 목적지 도착 전 정류장
    await this.getPassengers(userId)

    this.passengersCallback.forEach((callback) => {
      callback(this.passengers)
    })
  }

  // DB에서 최신 승객 데이터를 가져오기
  async getPassengers(userId: number) {
    // Boarding 테이블에서 userId로 데이터를 가져옴
    const passengers = await this.prisma.boarding.findMany({
      where: { userId },
      include: { user: true },
    })

    // User 테이블에서 requires 데이터를 가져옴
    const usersRequires = await this.prisma.user.findMany({
      where: {
        id: {
          in: passengers.map((p) => p.userId), // Boarding 테이블에서 가져온 userId 리스트
        },
      },
      include: {
        requires: true, // requires 필드를 포함해서 가져옴
      },
    })

    // 기존의 승객 정보 유지
    const newPassengers = passengers.map((p) => {
      const user = usersRequires.find((u) => u.id === p.userId) // 해당 userId에 맞는 requires 데이터 찾기
      return {
        userId: p.userId,
        startStation: p.startStation,
        endStation: p.endStation,
        requires: user?.requires.map((req) => req.require) || [], // requires 데이터를 string[] 형식으로 변환
      }
    })

    // 기존 승객 정보와 합쳐서 중복 제거
    this.passengers = [
      ...this.passengers.filter(
        (existing) =>
          !newPassengers.some((newP) => newP.userId === existing.userId),
      ),
      ...newPassengers,
    ]
  }

  // 탑승자 변경 사항 알림 등록
  dataToPassengerUpdates(callback: (passengers: Passenger[]) => void) {
    this.passengersCallback.push(callback)
  }

  removePassengerFromList(userId: number) {
    this.passengers = this.passengers.filter(
      (passenger) => passenger.userId !== userId,
    )
  }
}
