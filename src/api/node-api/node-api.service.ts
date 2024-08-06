import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { lastValueFrom } from 'rxjs'
import { map } from 'rxjs/operators'
import * as xml2js from 'xml2js'

@Injectable()
export class NodeApiService {
  private readonly nodeIdByroutnm: string
  private readonly getRoute: string
  private readonly seoulIdByRoute: string
  private readonly getSeoulRoute: string

  // 사용한 API 경로
  constructor(private readonly httpService: HttpService) {
    const API_KEY = process.env.API_KEY
    const API_NODE_URL = process.env.API_NODE_URL // json
    const SEOUL_NODE_URL = process.env.SEOUL_NODE_URL // xml
    const API_TEMP_KEY = process.env.API_TEMP_KEY
    this.nodeIdByroutnm = `${API_NODE_URL}/getRouteNoList?serviceKey=${API_KEY}`
    this.getRoute = `${API_NODE_URL}/getRouteAcctoThrghSttnList?serviceKey=${API_KEY}`
    this.seoulIdByRoute = `${SEOUL_NODE_URL}/getBusRouteList?serviceKey=${API_TEMP_KEY}`
    this.getSeoulRoute = `${SEOUL_NODE_URL}/getStaionByRoute?serviceKey=${API_TEMP_KEY}`
  }

  // 노선번호로 노선아이디 찾기
  async getRouteIdByRouteNo(routeNo: string, cityCode: string): Promise<any> {
    const url = `${this.nodeIdByroutnm}&pageNo=1&numOfRows=10&_type=json&cityCode=${cityCode}&routeNo=${routeNo}`

    try {
      const response = await lastValueFrom(
        this.httpService.get(url).pipe(map((response) => response.data)),
      )
      // console.log('response:', response)

      const items = response.response.body.items.item
      // console.log('items:', items)

      const filteredItems = items.filter(
        (item) => item.routeno.toString() === routeNo,
      )
      // console.log('filteredItems:', filteredItems)

      return filteredItems
    } catch (error) {
      console.error('Error fetching route data:', error)
      return null
    }
  }

  // 노선 아이디로 노선경로 불러오기
  async getRouteByRouteId(routeId: string, cityCode: string) {
    let count: string = '0'
    const url_count = `${this.getRoute}&pageNo=1&numOfRows=${count}&_type=json&cityCode=${cityCode}&routeId=${routeId}`
    const response_count = await lastValueFrom(
      this.httpService.get(url_count).pipe(map((response) => response.data)),
    )
    count = response_count.response.body.totalCount // 전체 경로 수
    // 경로 추출
    const url = `${this.getRoute}&pageNo=1&numOfRows=${count}&_type=json&cityCode=${cityCode}&routeId=${routeId}`
    const response = await lastValueFrom(
      this.httpService.get(url).pipe(map((response) => response.data)),
    )
    const route = response.response.body.items.item.map((item) => ({
      nodenm: item.nodenm,
    }))
    // console.log('route:', route)

    return route
  }

  // 노선번호로 서울 경로 id 찾기
  async getRouteIdSeoul(routeNo: string) {
    const url = `${this.seoulIdByRoute}&strSrch=${routeNo}`
    const response = await lastValueFrom(
      this.httpService.get(url).pipe(map((response) => response.data)),
    )

    const parsedData = await xml2js.parseStringPromise(response)
    console.log('parsedData:', parsedData)

    const routeIds =
      parsedData.ServiceResult.msgBody[0].itemList[0].busRouteId[0]
    console.log('routeIds:', routeIds)

    return routeIds
  }

  // 서울 노선아이디로 경로 불러오기
  async getSeoulRouteById(routeId: string) {
    const url = `${this.getSeoulRoute}&busRouteId=${routeId}`
    const response = await lastValueFrom(
      this.httpService.get(url).pipe(map((response) => response.data)),
    )

    const parsedData = await xml2js.parseStringPromise(response)
    console.log('parsedData:', parsedData)

    const seoulRoute = parsedData.ServiceResult.msgBody[0].itemList.map(
      (item) => item.stationNm[0],
    )
    console.log('seoulRoute:', seoulRoute)

    return seoulRoute
  }

  // 도시 코드로 서울과 타지역 구분지어서 경로 반환하기
  async getRouteDetails(routeNo: string, cityCode: string) {
    if (cityCode === '11') {
      const routeIds = await this.getRouteIdSeoul(routeNo)
      console.log('routeIds2:', routeIds)

      const stopByRoute = await this.getSeoulRouteById(routeIds)
      console.log('stopByRoute:', stopByRoute)

      return { routeNo: routeNo, stops: stopByRoute }
    }

    const busInfo = await this.getRouteIdByRouteNo(routeNo, cityCode)
    // console.log('busInfo:', busInfo)

    const stopByRoute = await this.getRouteByRouteId(
      busInfo[0].routeid,
      cityCode,
    )
    const busStops = stopByRoute.map((item) => item.nodenm)
    // console.log('busStops:', busStops)

    return { routeNo: routeNo, stops: busStops }
  }
}
