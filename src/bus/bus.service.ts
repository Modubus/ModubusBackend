import { Injectable, NotFoundException } from '@nestjs/common'
import { LocationSearchApiService } from '../api/location-search-api/location-search-api.service'
import { BusArrivalInfo } from './Dto/busArrivalInfo'
import { Location } from './Dto/location'
import { BusStopApiService } from '../api/bus-stop-api/bus-stop-api.service'
import { OdsayApiService } from '../api/odsay-api/odsay-api.service'
import { NodeApiService } from 'src/api/node-api/node-api.service'
import { Bus, PrismaClient } from '@prisma/client'
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

    return await this.busToStation(station)
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
      stationInfo.cityCode,
      stationInfo.nodeid,
    )

    const busInfos: BusArrivalInfo[] = arrivalBusInfos.map((arrival) => ({
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

  async getBusInfoToUser(routeno: string, startStation: string) {
    const nodeInfo = await this.locationSearchApiService.performSearch(
      startStation,
    )
    console.log(nodeInfo)
    const stationInfo = await this.busStopApiService.busToStation(
      nodeInfo.lat,
      nodeInfo.lon,
    )
    console.log(stationInfo)
    const routeId = await this.nodeApiService.getRouteIdSeoul(routeno)
    const busInfo = await this.busStopApiService.SeoulBoardBusInfo(
      'ord', // 이거 찾아서 실제 값이랑 반환 값 다시 수정 필요
      stationInfo[0].nodeid,
      routeId,
    )
    return busInfo
  }

  async reserveBus(
    startStation: string,
    endStation: string,
    routeno: string,
    userId: number,
  ) {
    const nodeInfo = await this.locationSearchApiService.performSearch(
      startStation,
    )
    const busesLocationInfo =
      await this.nodeApiService.getBusesLocationByRouteno(routeno)

    const vehicleno: string = this.findClosestBus(
      nodeInfo[0].lat,
      nodeInfo[0].lon,
      busesLocationInfo,
    )

    const bus: Bus = await this.prisma.bus.findFirst({
      where: { vehicleno: vehicleno },
    })

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    await this.prisma.boarding.create({
      data: {
        busId: bus.id,
        userId: userId,
        startStation: startStation,
        endStation: endStation,
      },
    })

    await this.driverService.notifyToDriverUpdates(userId)

    return { message: 'Boarding record changed.' }
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

    await this.driverService.notifyToDriverUpdates(userId)

    return { message: 'Boarding record changed.' }
  }
}
