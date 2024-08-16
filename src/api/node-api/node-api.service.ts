import { HttpService } from '@nestjs/axios'
import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { lastValueFrom } from 'rxjs'
import { map } from 'rxjs/operators'
import * as xml2js from 'xml2js'

@Injectable()
export class NodeApiService {
  private readonly nodeIdByroutnm: string
  private readonly getRoute: string
  private readonly getSeoulIdByRoute: string
  private readonly getSeoulRoute: string
  private readonly getStartEndNode: string
  private readonly getSeoulStartEndNode: string

  constructor(private readonly httpService: HttpService) {
    const BUS_API_KEY = process.env.BUS_API_KEY
    const API_NODE_URL = process.env.API_NODE_URL // json
    const SEOUL_NODE_URL = process.env.SEOUL_NODE_URL // xml
    this.nodeIdByroutnm = `${API_NODE_URL}/getRouteNoList?serviceKey=${BUS_API_KEY}`
    this.getRoute = `${API_NODE_URL}/getRouteAcctoThrghSttnList?serviceKey=${BUS_API_KEY}`
    this.getStartEndNode = `${API_NODE_URL}/getRouteInfoIem?serviceKey=${BUS_API_KEY}`
    // type city routeId
    this.getSeoulIdByRoute = `${SEOUL_NODE_URL}/getBusRouteList?serviceKey=${BUS_API_KEY}`
    this.getSeoulRoute = `${SEOUL_NODE_URL}/getStaionByRoute?serviceKey=${BUS_API_KEY}`
    this.getSeoulStartEndNode = `${SEOUL_NODE_URL}/getRouteInfo?serviceKey=${BUS_API_KEY}`
  }

  async getRouteIdByRouteNo(routeNo: string, cityCode: string): Promise<any> {
    const url = `${this.nodeIdByroutnm}&pageNo=1&numOfRows=10&_type=json&cityCode=${cityCode}&routeNo=${routeNo}`

    try {
      const response = await lastValueFrom(
        this.httpService.get(url).pipe(map((response) => response.data)),
      )

      let items = response.response.body.items.item

      // items가 객체일 경우 배열로 변환
      if (!Array.isArray(items)) {
        items = [items]
      }

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

  async getRouteByRouteId(routeId: string, cityCode: string) {
    try {
      let count: string = '0'
      const url_count = `${this.getRoute}&pageNo=1&numOfRows=${count}&_type=json&cityCode=${cityCode}&routeId=${routeId}`

      const response_count = await lastValueFrom(
        this.httpService.get(url_count).pipe(map((response) => response.data)),
      )

      count = response_count.response.body.totalCount

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

  async getRouteIdSeoul(routeNo: string) {
    try {
      const url = `${this.getSeoulIdByRoute}&strSrch=${routeNo}`

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

  async getRouteDetails(routeNo: string, cityCode: string) {
    try {
      if (cityCode === '21') {
        const routeIds = await this.getRouteIdSeoul(routeNo)

        const stopByRoute = await this.getSeoulRouteById(routeIds)

        const stopNames = stopByRoute.map((stop) => stop)

        return { routeNo: routeNo, stops: stopNames }
      }

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

  async getStartEndNodeByRouteNo(routeNo: string, cityCode: string) {
    try {
      // 서울일때
      if (cityCode === '21') {
        const routeId = await this.getRouteIdSeoul(routeNo)
        const url = `${this.getSeoulStartEndNode}&busRouteId=${routeId}`

        const response = await lastValueFrom(
          this.httpService.get(url).pipe(map((response) => response.data)),
        )

        const parsedData = await xml2js.parseStringPromise(response)

        const startnodenm =
          parsedData.ServiceResult.msgBody[0].itemList[0].stStationNm[0]
        const endnodenm =
          parsedData.ServiceResult.msgBody[0].itemList[0].edStationNm[0]

        return {
          startnodenm,
          endnodenm,
        }
      }
      // 나머자
      const routeInfo = await this.getRouteIdByRouteNo(routeNo, cityCode)
      const routeId = routeInfo[0].routeid
      const url = `${this.getStartEndNode}&_type=json&cityCode=${cityCode}&routeId=${routeId}`
      const response = await lastValueFrom(
        this.httpService.get(url).pipe(map((response) => response.data)),
      )
      let startnodenm
      let endnodenm

      const items = response.response.body.items.item

      // 아이템이 배열인지 객체인지 판단하여 처리
      if (Array.isArray(items)) {
        // 배열일 때 첫 번째 아이템 사용
        startnodenm = items[0].startnodenm
        endnodenm = items[0].endnodenm
      } else {
        // 객체일 때 직접 속성에 접근
        startnodenm = items.startnodenm
        endnodenm = items.endnodenm
      }

      return {
        startnodenm,
        endnodenm,
      }
    } catch (error) {
      console.error('Error fetching start and end node details:', error)
      throw new HttpException(
        'Failed to fetch start and end node details.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
