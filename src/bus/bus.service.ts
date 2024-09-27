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

    // stationInfo 배열에 있는 모든 정류장을 병렬로 확인
    await Promise.all(
      stationInfo.map(async (station) => {
        if (busInfo2) return // 이미 찾았으면 나머지 요청은 중단

        try {
          const busInfo = await this.busStopApiService.busArrivalInfo(
            station.arsId,
          )

          // busInfo가 null인지 확인
          if (!busInfo) {
            console.error(
              `Failed to fetch bus info for station: ${station.stationNm} (${station.arsId})`,
            )
            return
          }

          // 라우트 번호와 일치하는 버스를 필터링
          const matchingBus = busInfo.filter(
            (bus) =>
              bus.rtNm.trim().toLowerCase() === routeno.trim().toLowerCase(),
          )

          console.log('matchingBus', matchingBus)

          if (matchingBus.length > 0) {
            const ord = matchingBus[0].staOrd
            const routeId = matchingBus[0].busRouteId
            const stId = station.stationId

            busInfo2 = await this.busStopApiService.SeoulBoardBusInfo(
              parseInt(ord),
              stId,
              routeId,
            )
            console.log('busInfo2', busInfo2)
          }
        } catch (error) {
          console.error(`Error fetching bus arrival info: ${error.message}`)
        }
      }),
    )

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
    // Step 1: Boarding 테이블에서 해당 userId로 데이터를 찾음
    const cancelUser = await this.prisma.boarding.findFirst({
      where: { userId: userId },
    })

    // Step 2: 해당 유저의 boarding 기록이 없을 때 예외 처리
    if (!cancelUser) {
      throw new NotFoundException(
        `No boarding record found for user with ID ${userId}`,
      )
    }

    // Step 3: Boarding 테이블에서 해당 기록 삭제
    await this.prisma.boarding.delete({
      where: { id: cancelUser.id },
    })

    // Step 4: DriverService에서 해당 유저를 passengers 리스트에서 삭제
    await this.driverService.removePassengerFromList(userId)

    // Step 5: 승객 정보 업데이트 알림
    await this.driverService.notifyToDriverUpdates(userId)

    return { message: 'Boarding record changed.' }
  }
}
