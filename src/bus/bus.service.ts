import { Length } from 'class-validator'
import { Injectable, NotFoundException } from '@nestjs/common'
import { LocationSearchApiService } from '../api/location-search-api/location-search-api.service'
import { Location } from './Dto/location'
import { BusStopApiService } from '../api/bus-stop-api/bus-stop-api.service'
import { OdsayApiService } from '../api/odsay-api/odsay-api.service'
import { NodeApiService } from 'src/api/node-api/node-api.service'
import { PrismaClient } from '@prisma/client'
import { DriverService } from 'src/driver/driver.service'
import { BusRouteInfo } from 'src/api/odsay-api/Dto/busRouteInfo'
import { BusArrivalInfo } from 'src/api/bus-stop-api/Dto/busArriveInfo'

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

  // 주어진 버스 정류장 위치에 대한 버스 도착 정보를 반환
  async busToStation(station: Location): Promise<BusArrivalInfo[]> {
    const stationInfos = await this.busStopApiService.busToStation(
      station.lat,
      station.lon,
    )

    if (!stationInfos) {
      throw new Error('Failed to fetch bus station information')
    }

    const stationInfo = stationInfos[0]
    const busArrivalInfo: BusArrivalInfo[] =
      await this.busStopApiService.busArrivalInfo(stationInfo.arsId)
    return busArrivalInfo
  }

  async findBusDestinationRoute(
    startStation: string,
    endStation: string,
  ): Promise<BusRouteInfo[]> {
    const startLocation = await this.locationSearchApiService.performSearch(
      startStation,
    )

    if (!startLocation) {
      throw new NotFoundException(
        'No station found for the given start location',
      )
    }

    const endLocation = await this.locationSearchApiService.performSearch(
      endStation,
    )

    if (!endLocation) {
      throw new NotFoundException('No station found for the given end location')
    }

    const startX = startLocation.lon
    const startY = startLocation.lat

    const endX = endLocation.lon
    const endY = endLocation.lat
    const busRouteData: BusRouteInfo[] =
      await this.odsayApiService.searchBusRoutes(startX, startY, endX, endY)

    return busRouteData
  }

  async getBusInfoToUser(routeno: string, startStation: string) {
    const nodeInfo = await this.locationSearchApiService.performSearch(
      startStation,
    )

    const stationInfo = await this.busStopApiService.busToStation(
      nodeInfo.lat,
      nodeInfo.lon,
    )

    let busInfo2 = null

    // stationInfo 배열을 순회하면서 각 정류장에 대한 버스 정보를 확인
    for (let i = 0; i < Object.keys(stationInfo).length; i++) {
      const arsId = stationInfo[i].arsId // arsId로 해당 정류장의 ID를 얻음

      const busInfo = await this.busStopApiService.busArrivalInfo(arsId)

      // 버스 번호가 routeno와 일치하는 버스 정보를 필터링
      const busInfo1 = busInfo.filter((bus) => bus.rtNm === routeno)

      // 일치하는 버스가 있으면 처리
      if (busInfo1.length > 0) {
        const ord = busInfo1[0].staOrd
        const routeId = busInfo1[0].busRouteId
        const stId = stationInfo[i].stationId

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
    const startStationInfo = routeDetail.stops.find(
      (stop) => stop.nodenm === startStation,
    )

    const endStationInfo = routeDetail.stops.find(
      (stop) => stop.nodenm === endStation,
    )

    await this.prisma.boarding.create({
      data: {
        busId: bus.id,
        userId: userId,
        startStation: startStationInfo.stationId,
        endStation: endStationInfo.stationId,
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
