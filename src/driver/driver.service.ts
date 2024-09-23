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
      const futurePassengers = await this.countFuturePassengers(
        this.passengers,
        this.stationInfo.currentStationId!,
        bus.id,
      )

      // 반환할 버스 정보 구성
      const busInfo: BoardingInfo = {
        requires: ['이건 요구사항 어떻게 받는지 모름'], // 추후 수정 필요
        Station: this.stationInfo, // 나중에 정류소 명으로 바꿀 예정
        CurrentPassengers: this.passengers,
        futurePassengers: futurePassengers,
      }

      return busInfo
    } catch (error) {
      console.error('Error in getBusInfoToDriver:', error.message)
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
    } else {
      console.warn(`Unexpected stopFlag value: ${stopFlag}`)
      // 예상치 못한 값에 대해 별도의 처리 또는 로깅을 수행
    }
    return station
  }

  // 다음 정류장 ID를 가져오는 메서드
  private getNextStationId(currentStationId: string, routeDetail): string {
    // currentStationId와 일치하는 정류장의 인덱스를 찾음
    const currentIndex = routeDetail.stops.findIndex(
      (stop) => stop.station === currentStationId,
    )

    if (currentIndex !== -1 && currentIndex < routeDetail.stops.length - 1) {
      // 다음 정류장의 station 값을 반환
      const nextStation = routeDetail.stops[currentIndex + 1].station

      return nextStation
    } else if (currentIndex === routeDetail.stops.length - 1) {
      throw new Error('This is the last station in the route.')
    } else {
      throw new Error(`Station with ID ${currentStationId} not found.`)
    }
  }
  // 특정 버스의 현재 정류장 이후의 승객 수 계산
  async countFuturePassengers(
    passengers: Passenger[],
    currentStation: string,
    busId: number,
  ) {
    // 올바른 반환 타입 지정
    const bus = await this.prisma.bus.findUnique({
      where: { id: busId },
      include: { busCompany: true },
    })

    if (!bus) throw new Error('Bus not found')
    if (!bus.busCompany) throw new Error('Bus company information is missing')

    const busStopInfo = await this.nodeApiService.getRouteDetails(
      bus.routnm,
      bus.busCompany.cityCode,
    )
    const stops = busStopInfo.stops
    const currentStationIndex = stops.findIndex(
      (stop) => stop.stationId === currentStation,
    )

    if (currentStationIndex === -1) {
      throw new Error(
        `Current station ${currentStation} not found in the route.`,
      )
    }

    const futureStops = stops.slice(currentStationIndex + 1)
    return futureStops.map((stop) => ({
      // 반환 구조 일치
      station: stop.nodenm,
      count: passengers.filter((p) => p.startStation === stop.nodenm).length,
    }))
  }

  // 버스 위치 정보의 변경을 모니터링하는 함수
  public startMonitoringBusLocation(
    busInfo,
    callback: (locationChanged: boolean) => void,
  ): void {
    // 초기 실행 시 이전 정류장 ID를 설정
    if (this.previousStationId === null) {
      this.previousStationId = busInfo.Station.currentStationId
    }

    const intervalId = setInterval(async () => {
      const currentStationId = busInfo.Station.currentStationId

      // 이전 정류장 값과 현재 정류장 값을 비교
      if (this.hasLocationChanged(this.previousStationId, currentStationId)) {
        callback(true)
        clearInterval(intervalId)
      } else {
        // 이전 정류장을 현재 정류장으로 업데이트
        this.previousStationId = currentStationId
      }
    }, 5000) // 1분마다 polling
  }

  // 위치 변경 여부 확인 로직
  private hasLocationChanged(
    previousStationId: string | null,
    currentStationId: string | null,
  ): boolean {
    return previousStationId !== currentStationId
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
