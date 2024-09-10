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
    const stationInfo = await this.busToStation(station)

    const stations = stationInfo.map((bus: any) => {
      return {
        arrmsg1: bus.arrmsg1,
        rtNm: bus.rtNm,
      }
    })

    return stations
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
    console.log('nodeInfo', nodeInfo)

    const stationInfo = await this.busStopApiService.busToStation(
      nodeInfo.lat,
      nodeInfo.lon,
    )
    console.log('stationInfo', stationInfo)

    const routeId = await this.nodeApiService.getRouteIdSeoul(routeno)
    console.log('routeId', routeId)

    let busInfo2 = null

    // stationInfo 배열을 순회하면서 각 정류장에 대한 버스 정보를 확인
    for (let i = 0; i < Object.keys(stationInfo).length; i++) {
      const arsId = stationInfo[i].arsId // arsId로 해당 정류장의 ID를 얻음
      console.log('arsId', arsId)

      const busInfo = await this.busStopApiService.busArrivalInfo(arsId)
      console.log('ordInfo', busInfo)

      // 버스 번호가 routeno와 일치하는 버스 정보를 필터링
      const busInfo1 = busInfo.filter((bus) => bus.rtNm === routeno)
      console.log('busInfo1', busInfo1)
      // 일치하는 버스가 있으면 처리
      if (busInfo1.length > 0) {
        const ord = busInfo1[0].staOrd
        console.log('ord', ord)
        const routeId = busInfo1[0].busRouteId
        console.log('routeId', routeId)
        const stId = stationInfo[i].stationId
        console.log('stId', stId)

        // 해당 ord, nodeId, stId로 버스 정보 조회
        busInfo2 = await this.busStopApiService.SeoulBoardBusInfo(
          parseInt(ord),
          stId,
          routeId,
        )
        break // 일치하는 버스를 찾았으면 더 이상 순회를 하지 않음
      }
    }

    // 만약 일치하는 버스 정보가 없으면 에러 처리
    if (!busInfo2) {
      throw new Error('No matching bus found for the provided route number')
    }

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
      throw new NotFoundException(`ID ${vehicleno} not found`)
    }

    const routeDetail = await this.nodeApiService.getRouteDetails(
      bus.routnm,
      '21',
    )
    console.log('routeDetail', routeDetail)
    const startStationInfo = routeDetail.stops.find(
      (stop) => stop.stationNm === startStation,
    )

    const endStationInfo = routeDetail.stops.find(
      (stop) => stop.stationNm === endStation,
    )

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
