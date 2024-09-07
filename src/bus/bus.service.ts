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
  async getBusStationStart(startStation: string): Promise<any> {
    const station = await this.locationSearchApiService.performSearch(
      startStation,
    )

    if (!station) {
      throw new Error('No station found for the given start location')
    }

    return await this.busToStation(station)
  }

  // 주어진 버스 정류장 위치에 대한 버스 도착 정보를 반환
  async busToStation(station: Location): Promise<any> {
    const stationInfos = await this.busStopApiService.busToStation(
      station.lat,
      station.lon,
    )

    if (!stationInfos) {
      throw new Error('Failed to fetch bus station information')
    }

    const stationInfo = stationInfos[0]
    console.log('stationInfo', stationInfo)
    const busArrivalInfo = this.busStopApiService.busArrivalInfo(
      stationInfo.arsId,
    )
    return busArrivalInfo
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
    console.log('stationInfo', stationInfo)
    const routeId = await this.nodeApiService.getRouteIdSeoul(routeno)
    console.log('routeId', routeId)
    const nodeId = stationInfo[0].arsId // 여기서 가장 가까운 값이 나오게 해야겠음 어처피 나중에 사용자 위치 받아오는게 편할 듯 싶음
    console.log('nodeId', nodeId)
    const ordInfo = await this.busStopApiService.busArrivalInfo(nodeId)
    console.log('ordInfo', ordInfo)
    const busInfo1 = ordInfo.filter((bus) => bus.rtNm === routeno)
    const ord = busInfo1[0].sectOrd1
    console.log('ord', ord)
    // stdId 이거 찾으면 끝
    const busInfo2 = await this.busStopApiService.SeoulBoardBusInfo(
      parseInt(ord), // 이거 찾아서 실제 값이랑 반환 값 다시 수정 필요
      nodeId,
      routeId,
    )
    return busInfo2
  }

  async reserveBus(
    startStation: string,
    endStation: string,
    vehicleno: string,
    userId: number,
  ) {
    const bus = await this.prisma.bus.findUnique({
      where: { vehicleno: vehicleno },
    })

    if (!bus) {
      throw new NotFoundException(`User with ID ${vehicleno} not found`)
    }

    const routeDetail = await this.nodeApiService.getRouteDetails(
      bus.routnm,
      '21',
    )

    const startStationInfo = routeDetail.stops.find(
      (stop) => stop.stationNm === startStation,
    )

    const endStationInfo = routeDetail.stops.find(
      (stop) => stop.stationNm === endStation,
    )

    // If either station is not found, throw an error
    if (!startStationInfo || !endStationInfo) {
      throw new NotFoundException(
        `Start or end station not found in the route: ${startStation}, ${endStation}`,
      )
    }

    await this.prisma.boarding.create({
      data: {
        busId: bus.id,
        userId: userId,
        startStation: startStationInfo.station,
        endStation: endStationInfo.station,
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
