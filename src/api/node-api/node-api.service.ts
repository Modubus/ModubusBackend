import { HttpService } from '@nestjs/axios'
import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
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

      const items = response.response.body.items.item
      const filteredItems = items.filter(
        (item) => item.routeno.toString() === routeNo,
      )

      return filteredItems
    } catch (error) {
      console.error('Error fetching route data:', error)
      throw new HttpException(
        'Failed to fetch route data.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // 노선 아이디로 노선경로 불러오기
  async getRouteByRouteId(routeId: string, cityCode: string) {
    try {
      let count: string = '0'
      const url_count = `${this.getRoute}&pageNo=1&numOfRows=${count}&_type=json&cityCode=${cityCode}&routeId=${routeId}`
      const response_count = await lastValueFrom(
        this.httpService.get(url_count).pipe(map((response) => response.data)),
      )
      count = response_count.response.body.totalCount // 전체 경로 수

      const url = `${this.getRoute}&pageNo=1&numOfRows=${count}&_type=json&cityCode=${cityCode}&routeId=${routeId}`
      const response = await lastValueFrom(
        this.httpService.get(url).pipe(map((response) => response.data)),
      )
      const route = response.response.body.items.item.map((item) => ({
        nodenm: item.nodenm,
      }))

      return route
    } catch (error) {
      console.error('Error fetching route by route ID:', error)
      throw new HttpException(
        'Failed to fetch route by route ID.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // 노선번호로 서울 경로 id 찾기
  async getRouteIdSeoul(routeNo: string) {
    try {
      const url = `${this.seoulIdByRoute}&strSrch=${routeNo}`
      const response = await lastValueFrom(
        this.httpService.get(url).pipe(map((response) => response.data)),
      )

      const parsedData = await xml2js.parseStringPromise(response)
      const routeIds =
        parsedData.ServiceResult.msgBody[0].itemList[0].busRouteId[0]

      return routeIds
    } catch (error) {
      console.error('Error fetching Seoul route ID:', error)
      throw new HttpException(
        'Failed to fetch Seoul route ID.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // 서울 노선아이디로 경로 불러오기
  async getSeoulRouteById(routeId: string) {
    try {
      const url = `${this.getSeoulRoute}&busRouteId=${routeId}`
      const response = await lastValueFrom(
        this.httpService.get(url).pipe(map((response) => response.data)),
      )

      const parsedData = await xml2js.parseStringPromise(response)
      const seoulRoute = parsedData.ServiceResult.msgBody[0].itemList.map(
        (item) => item.stationNm[0],
      )

      return seoulRoute
    } catch (error) {
      console.error('Error fetching Seoul route by ID:', error)
      throw new HttpException(
        'Failed to fetch Seoul route by ID.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // 도시 코드로 서울과 타지역 구분지어서 경로 반환하기
  async getRouteDetails(routeNo: string, cityCode: string) {
    try {
      // 서울의 도시 코드가 '21'인 경우의 처리
      if (cityCode === '21') {
        const routeIds = await this.getRouteIdSeoul(routeNo)
        const stopByRoute = await this.getSeoulRouteById(routeIds)
        const stopNames = stopByRoute.map((stop) => stop.stopName)

        return { routeNo: routeNo, stops: stopNames }
      }
      // 서울이 아닌 다른 지역의 처리
      const busInfo = await this.getRouteIdByRouteNo(routeNo, cityCode)
      const stopByRoute = await this.getRouteByRouteId(
        busInfo[0].routeid,
        cityCode,
      )
      const busStops = stopByRoute.map((item) => item.nodenm)

      return { routeNo: routeNo, stops: busStops }
    } catch (error) {
      console.error('Error fetching route details:', error)
      throw new HttpException(
        'Failed to fetch route details.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
