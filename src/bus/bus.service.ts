import { Injectable, NotFoundException } from '@nestjs/common'
import { LocationSearchApiService } from '../api/location-search-api/location-search-api.service'
import { BusArrivalInfo } from './Dto/busArrivalInfo'
import { Location } from './Dto/location'
import { BusStopApiService } from '../api/bus-stop-api/bus-stop-api.service'
import { OdsayApiService } from '../api/odsay-api/odsay-api.service'
import { NodeApiService } from 'src/api/node-api/node-api.service'
import { PrismaClient } from '@prisma/client'
import { DriverService } from 'src/driver/driver.service'
@Injectable()
export class BusService {
  constructor(
    private prisma: PrismaClient,
    private nodeApiService: NodeApiService,
    private locationSearchApiService: LocationSearchApiService,
    private busStopApiService: BusStopApiService,
    private odsayApiService: OdsayApiService,
    private driverService: DriverService,
  ) {}

  // 출발지에서 가장 가까운 버스 정류장의 버스 도착 정보를 반환
  async getBusStationStart(startStation: string): Promise<BusArrivalInfo[]> {
    const station = await this.locationSearchApiService.performSearch(
      startStation,
    )

    if (!station) {
      throw new Error('No station found for the given start location')
    }

    return this.busToStation(station)
  }

  // 주어진 버스 정류장 위치에 대한 버스 도착 정보를 반환
  async busToStation(station: Location): Promise<BusArrivalInfo[]> {
    const stationInfos = await this.busStopApiService.busToStation(
      station.lat,
      station.lon,
    )

    if (!stationInfos.length) {
      throw new Error('Failed to fetch bus station information')
    }

    const stationInfo = stationInfos[0]

    const arrivalBusInfos = await this.busStopApiService.busArrivalInfo(
      stationInfo.citycode,
      stationInfo.nodeid,
    )

    const busInfos: BusArrivalInfo[] = arrivalBusInfos.map((arrival) => ({
      // 여기 DTO로 깔끔하게 할 수 있는지 알아보기
      arrprevstationcnt: arrival.arrprevstationcnt.toString(),
      vehicletp: arrival.vehicletp,
      arrtime: Number(arrival.arrtime),
      routeno: arrival.routeno,
    }))

    return busInfos
  }

  async getBusStationEnd(
    startStation: string,
    endStation: string,
  ): Promise<any> {
    // 시작 지점에 가장 가까운 정류장을 반환
    console.log('Searching start location for:', startStation)
    const startLocation = await this.locationSearchApiService.performSearch(
      startStation,
    )
    console.log('Found start location:', startLocation)

    if (!startLocation) {
      throw new NotFoundException(
        'No station found for the given start location',
      )
    }
    // 동일 api 호출 시 값이 timeout 오류 확인 -> 여러 방식으로 해결해보다가 동시 호출 문제를 해결
    //await new Promise((resolve) => setTimeout(resolve, 500))
    // 목적지에 가장 가까운 정류장을 반환
    console.log('Searching end location for:', endStation)
    const endLocation = await this.locationSearchApiService.performSearch(
      endStation,
    )
    console.log('Found end location:', endLocation)

    if (!endLocation) {
      throw new NotFoundException('No station found for the given end location')
    }

    const startX = startLocation.lon
    const startY = startLocation.lat
    console.log(`Start coordinates: X = ${startX}, Y = ${startY}`)

    const endX = endLocation.lon
    const endY = endLocation.lat
    console.log(`End coordinates: X = ${endX}, Y = ${endY}`)

    // 시작 좌표에서 목적지 좌표까지의 버스 경로 정보 반환
    console.log('Searching bus routes...')
    const busRouteData = await this.odsayApiService.searchBusRoutes(
      startX,
      startY,
      endX,
      endY,
    )
    console.log('Bus route data:', busRouteData)

    return busRouteData
  }

  async getBusInfo(routeno: string, startStation: string) {
    // 곧 탑승 할 버스의 정보를 반환
    const nodeInfo = this.locationSearchApiService.performSearch(startStation)
    const stationInfo = this.busStopApiService.busToStation(
      nodeInfo[0].lat,
      nodeInfo[0].lon,
    )
    const route = this.nodeApiService.getRouteIdByRouteNo(
      routeno,
      stationInfo[0].cityCode,
    )
    const busInfo = this.busStopApiService.BoardBusInfo(
      stationInfo[0].cityCode,
      stationInfo[0].nodeid,
      route[0].routeid,
    )
    // getRouteByRouteId(routeId, cityCode) - 노선 경로
    // getSeoulRouteById(routeId) - 서울 노선 경로
    return busInfo
  } // 버스의 위치, 남은 시간 혹은 정류장 수, 버스의 노선번호
  async reserveBus(
    startStation: string,
    endStation: string,
    routeno: string,
    userId: number,
  ) {
    let busId: number // 노선 번호에 맞는 버스 id 검색로직 필요 추가하기 - 정류소 위치가 필요하지 않나 아마 로직 이미있을듯

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    const boarding = await this.prisma.boarding.create({
      data: {
        busId: busId,
        userId: userId,
        startStation: startStation,
        endStation: endStation,
      },
    })

    // 변경 사항을 DriverService에 알림
    this.driverService.notifyBusInfoSubscribers()

    return boarding
  }

  async cancelBus(userId: number) {
    const cancelUser = await this.prisma.boarding.findFirst({
      where: { userId: userId },
    })

    if (!cancelUser) {
      throw new NotFoundException(
        `No boarding record found for user with ID ${userId}`,
      )
    }

    await this.prisma.boarding.delete({
      where: { id: cancelUser.id },
    })

    // 변경 사항을 DriverService에 알림
    this.driverService.notifyBusInfoSubscribers()

    return { message: 'Boarding record successfully deleted.' }
  }
}
