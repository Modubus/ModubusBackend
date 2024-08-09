import { Injectable, NotFoundException } from '@nestjs/common'
import { LocationSearchApiService } from '../api/location-search-api/location-search-api.service'
import { BusArrivalInfo } from './Dto/BusArrivalInfo'
import { Location } from './Dto/location'
import { BusStopApiService } from '../api/bus-stop-api/bus-stop-api.service'
import { OdsayApiService } from '../api/odsay-api/odsay-api.service'
import { NodeApiService } from 'ModubusBackend/src/api/node-api/node-api.service'
@Injectable()
export class BusService {
  constructor(
    private nodeApiService: NodeApiService,
    private locationSearchApiService: LocationSearchApiService,
    private busStopApiService: BusStopApiService,
    private odsayApiService: OdsayApiService,
  ) {}

  // 출발지에서 가장 가까운 버스 정류장의 버스 도착 정보를 반환
  async getBusStationStart(startStation: string): Promise<BusArrivalInfo[]> {
    const station = await this.locationSearchApiService.performSearch(
      startStation,
    )

    if (!station) {
      throw new Error('No station found for the given start location')
    }

    return this.busToStation(station[0])
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
    // 정의 해야됨
    // 시작 지점에 가장 가까운 정류장을 반환
    const startLocation = await this.locationSearchApiService.performSearch(
      startStation,
    )
    if (!startLocation) {
      throw new NotFoundException(
        'No station found for the given start location',
      )
    }

    // 목적지에 가장 가까운 정류장을 반환
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

    // 시작 좌표에서 목적지 좌표까지의 버스 경로 정보 반환
    const BusRouteData = this.odsayApiService.searchBusRoutes(
      startX,
      startY,
      endX,
      endY,
    )
    return BusRouteData
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
  }

  async reserveBus() {
    //  @Post
    // /:stationId/:busId
    // 탑승할 버스의 기사에게 사용자 데이터 보내기
    // (사용자 요구사항, 사용자 출발 정류장 정보, 하차 정류장 정보, 탑승인원 카운트)
  }

  async cancelBus() {
    //  @Delete
    // /:stationId/:busId
    // 탑승할 버스기사에게 있는 사용자 데이터 삭제하기
    // (사용자 정보 삭제)
  }
}
