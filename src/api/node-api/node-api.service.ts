import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import axios from 'axios'
import * as xml2js from 'xml2js' // 삭제 예정
import { Route, RouteDetail, RouteItem } from './Dto/route'
import { StartEndNode } from './Dto/startEndNode'
import { BusLocationInfo } from './Dto/busLocationInfo'

@Injectable()
export class NodeApiService {
  private readonly nodeIdByroutnm: string
  private readonly getRoute: string
  private readonly getSeoulIdByRoute: string
  private readonly getSeoulRoute: string
  private readonly getStartEndNode: string
  private readonly getSeoulStartEndNode: string
  private readonly getBusPosByRtid: string
  private readonly getBusPosByVehId: string

  constructor() {
    const BUS_API_KEY = process.env.BUS_API_KEY
    const API_NODE_URL =
      'http://apis.data.go.kr/1613000/BusRouteInfoInqireService' // json
    const SEOUL_NODE_URL = 'http://ws.bus.go.kr/api/rest/busRouteInfo'
    const SEOUL_BUS_STOP_URL = 'http://ws.bus.go.kr/api/rest/buspos'

    //TagoAPI
    this.nodeIdByroutnm = `${API_NODE_URL}/getRouteNoList?serviceKey=${BUS_API_KEY}`
    this.getRoute = `${API_NODE_URL}/getRouteAcctoThrghSttnList?serviceKey=${BUS_API_KEY}`
    this.getStartEndNode = `${API_NODE_URL}/getRouteInfoIem?serviceKey=${BUS_API_KEY}`
    // SeoulBusAPI
    this.getSeoulIdByRoute = `${SEOUL_NODE_URL}/getBusRouteList?serviceKey=${BUS_API_KEY}`
    this.getSeoulRoute = `${SEOUL_NODE_URL}/getStaionByRoute?serviceKey=${BUS_API_KEY}`
    this.getSeoulStartEndNode = `${SEOUL_NODE_URL}/getRouteInfo?serviceKey=${BUS_API_KEY}`
    // SeoulBusStopAPI
    this.getBusPosByRtid = `${SEOUL_BUS_STOP_URL}/getBusPosByRtid?serviceKey=${BUS_API_KEY}` // url 수정 예정
    this.getBusPosByVehId = `${SEOUL_BUS_STOP_URL}/getBusPosByVehId?serviceKey=${BUS_API_KEY}` // url 수정 예정
  }

  async getRouteIdByRouteNo(
    routeNo: string,
    cityCode: string,
  ): Promise<RouteItem[]> {
    const url = `${this.nodeIdByroutnm}&pageNo=1&numOfRows=10&_type=json&cityCode=${cityCode}&routeNo=${routeNo}`
    console.log(url)
    try {
      const response = await axios.get(url)
      const items = response.data.response?.body?.items?.item

      if (!items) {
        throw new HttpException(
          'No items found in the response.',
          HttpStatus.NOT_FOUND,
        )
      }

      const itemsArray = Array.isArray(items) ? items : [items]

      const filteredItems = itemsArray.filter(
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

  async getRouteByRouteId(
    routeId: string,
    cityCode: string,
  ): Promise<RouteDetail[]> {
    try {
      // 1. api의 총 데이터 수를 받아온다
      const urlCount = `${this.getRoute}&pageNo=1&numOfRows=0&_type=json&cityCode=${cityCode}&routeId=${routeId}`
      const responseCount = await axios.get(urlCount)
      const totalCount = responseCount.data.response.body.totalCount

      // 2: 알맞는 전체 값으로 데이터를 불러온다
      const url = `${this.getRoute}&pageNo=1&numOfRows=${totalCount}&_type=json&cityCode=${cityCode}&routeId=${routeId}`
      const response = await axios.get(url)

      // 3. 정류장의 이름을 하나로 모아서 경로 전체의 정보를 만든다.
      const route: RouteDetail[] = response.data.response.body.items.item.map(
        (item) => ({
          nodenm: item.nodenm,
        }),
      )

      return route
    } catch (error) {
      console.error('Error fetching route by route ID:', error)
      throw new HttpException(
        'Failed to fetch route by route ID.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async getRouteIdSeoul(routeNo: string): Promise<string> {
    // resultType=json으로 변경은 추후 진행 예정
    try {
      const url = `${this.getSeoulIdByRoute}&strSrch=${routeNo}`
      console.log('urlId', url)
      const response = await axios.get(url)

      const parsedData = await xml2js.parseStringPromise(response.data)

      const routeIds =
        parsedData.ServiceResult.msgBody[0].itemList[0].busRouteId[0]

      return routeIds.toString()
    } catch (error) {
      console.error('Error fetching Seoul route ID:', error)
      throw new HttpException(
        'Failed to fetch Seoul route ID.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async getSeoulRouteById(routeId: string): Promise<RouteDetail[]> {
    try {
      const url = `${this.getSeoulRoute}&busRouteId=${routeId}`
      console.log('urlRoute', url)
      const response = await axios.get(url)

      const parsedData = await xml2js.parseStringPromise(response.data)
      const seoulRoute: RouteDetail[] =
        parsedData.ServiceResult.msgBody[0].itemList.map((item) => ({
          nodenm: item.stationNm[0],
          stationId: item.station[0],
        }))

      return seoulRoute
    } catch (error) {
      console.error('Error fetching Seoul route by ID:', error)
      throw new HttpException(
        'Failed to fetch Seoul route by ID.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async getRouteDetails(routeNo: string, cityCode: string): Promise<Route> {
    try {
      if (cityCode === '21') {
        const routeId = await this.getRouteIdSeoul(routeNo)
        const stopByRoute = await this.getSeoulRouteById(routeId)
        return { routeNo: routeNo, stops: stopByRoute }
      }

      const busInfo = await this.getRouteIdByRouteNo(routeNo, cityCode)
      const stopByRoute = await this.getRouteByRouteId(
        busInfo[0].routeid,
        cityCode,
      )
      // const busStops = stopByRoute.map((item) => item.nodenm)

      return { routeNo: routeNo, stops: stopByRoute }
    } catch (error) {
      console.error('Error fetching route details:', error)
      throw new HttpException(
        'Failed to fetch route details.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async getStartEndNodeByRouteNo(
    routeNo: string,
    cityCode: string,
  ): Promise<StartEndNode> {
    try {
      // 서울일 때
      if (cityCode === '21') {
        const routeId = await this.getRouteIdSeoul(routeNo)
        const url = `${this.getSeoulStartEndNode}&busRouteId=${routeId}`

        const response = await axios.get(url)
        const data = response.data

        const startnodenm = data.ServiceResult.msgBody.itemList[0].stStationNm
        const endnodenm = data.ServiceResult.msgBody.itemList[0].edStationNm

        return {
          startnodenm,
          endnodenm,
        }
      }

      // 나머지 경우
      const routeInfo = await this.getRouteIdByRouteNo(routeNo, cityCode)
      const routeId = routeInfo[0].routeid
      const url = `${this.getStartEndNode}&_type=json&cityCode=${cityCode}&routeId=${routeId}`

      // JSON 응답 처리
      const response = await axios.get(url)
      const items = response.data.response.body.items.item

      let startnodenm, endnodenm

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

  async getBusesLocationByRouteno(
    routeno: string,
    vehicleno: string,
  ): Promise<BusLocationInfo[]> {
    try {
      const routeId = await this.getRouteIdSeoul(routeno) // 노선 아이디로 차량 아이디 찾아야 됨 실수로 지움
      const vehicleId = await this.getVehicleIdByRouteIdAndVehicleNo(
        routeId,
        vehicleno,
      )
      const url = `${this.getBusPosByVehId}&vehId=${vehicleId}&resultType=json`
      const response = await axios.get(url)
      const items = response.data.msgBody.itemList
      const busLocationInfo: BusLocationInfo[] = items.map((item) => ({
        vehicleno: item.plainNo,
        stord: item.stOrd,
        stopFlag: item.stopFlag,
        stId: item.stId,
      }))

      return busLocationInfo
    } catch (error) {
      console.error('Error fetching buses', error)
      throw new HttpException(
        'Failed to fetch route details.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // API에서 vehicleId 받아오기
  async getVehicleIdByRouteIdAndVehicleNo(routeId, vehicleno): Promise<string> {
    try {
      const url = `${this.getBusPosByRtid}&busRouteId=${routeId}&resultType=json`
      const response = await axios.get(url)
      const items = response.data.msgBody.itemList
      const checkInfo = items.map((item) => ({
        vehId: item.vehId,
        vehicleno: item.plainNo,
      }))
      const foundBus = checkInfo.find((item) => item.vehicleno === vehicleno)
      const vehicleId = foundBus.vehId.toString()

      return vehicleId
    } catch (error) {
      console.log(error)
      throw new HttpException(
        'Failed to fetch vehicleNo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
