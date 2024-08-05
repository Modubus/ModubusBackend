import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { lastValueFrom } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class NodeApiService {
  private readonly nodeIdByroutnm: string
  private readonly getRoute: string
  private readonly seoulIdByRoute: string
  private readonly getSeoulRoute: string
  constructor(private readonly httpService: HttpService) {
    const API_KEY = process.env.API_KEY
    const API_NODE_URL = process.env.API_NODE_URL
    const SEOUL_NODE_URL = process.env.SEOUL_NODE_URL

    this.nodeIdByroutnm = `${API_NODE_URL}/getRouteNoList?serviceKey=${API_KEY}`
    this.getRoute = `${API_NODE_URL}/getRouteAcctoThrghSttnList?serviceKey=${API_KEY}`
    this.seoulIdByRoute = `${SEOUL_NODE_URL}/getBusRouteList?serviceKey=${API_KEY}`
    this.getSeoulRoute = `${SEOUL_NODE_URL}/getStaionByRoute?serviceKey=${API_KEY}`
  } // 기본 api경로

  async getRouteIdByRouteNo(routeNo: string, cityCode: string) {
    const url = `${this.nodeIdByroutnm}&pageNo=1&numOfRows=10&_type=json&cityCode=${cityCode}&routeNo=${routeNo}`
    const response = await lastValueFrom(
      this.httpService.get(url).pipe(map((response) => response.data)),
    )
    return response.response.body.items.item.find(
      // 겹치는 routeno를 가진 데이터에서 같은 번호 추출
      (item) => item.routeno == routeNo,
    )
  } // 노선 번호로 노선 id 접근

  async getRouteByRouteId(routeId: string, cityCode: string) {
    // 노선id로 노선정보 접근 후 반환
    const url = `${this.getRoute}&pageNo=1&numOfRows=10&_type=json&cityCode=${cityCode}&routeId=${routeId}`
    const response = await lastValueFrom(
      this.httpService.get(url).pipe(map((response) => response.data)),
    )
    const route = response.response.body.items.item.map((item) => ({
      nodenm: item.nodenm,
    }))
    return route
  }

  async getRouteIdSeoul(routeNo: string) {
    // 서울 노선 번호로 노선 id 접근
    // seoul 버스 api 승인 x 추후 개발
    const url = `${this.seoulIdByRoute}&strSrch=${routeNo}&json`
    const response = await lastValueFrom(
      this.httpService.get(url).pipe(map((response) => response.data)),
    )
    const routeIds = response.ServiceResult.msgBody.itemList.map(
      (item) => item.busRouteId,
    )

    return routeIds
  }

  async getSeoulRouteById(routeNo: string) {
    // 서울 노선id로 노선정보 접근 후 반환
    // seoul 버스 api 승인 x 추후 확인
    const routeIds = await this.getRouteIdSeoul(routeNo)
    const url = `${this.getSeoulRoute}&busRouteId=${routeIds}&json`
    const response = await lastValueFrom(
      this.httpService.get(url).pipe(map((response) => response.data)),
    )
    const seoulRoute = response.ServiceResult.msgBody.itemList.map(
      (item) => item.stationNm,
    )
    return seoulRoute
  }

  async getRouteDetails(routeNo: string, cityCode: string) {
    // 서울시의 버스 노선 정보 조회
    if (cityCode === '11') {
      // 서울 도시코드 11번
      const routeIds = await this.getRouteIdSeoul(routeNo)
      const stopByRoute = await this.getSeoulRouteById(routeIds)
      const busStops = stopByRoute.map((item) => item.stationNm)
      return { routeNo: routeNo, stops: busStops }
    }

    // 그 외 지역의 버스 노선 정보 조회
    const routeNumberAPI = await this.getRouteIdByRouteNo(routeNo, cityCode)
    const routeId = routeNumberAPI.id
    const stopByRoute = await this.getRouteByRouteId(routeId, cityCode)
    const busStops = stopByRoute.map((item) => item.nodenm)
    return { routeNo: routeNo, stops: busStops }
  }
}
