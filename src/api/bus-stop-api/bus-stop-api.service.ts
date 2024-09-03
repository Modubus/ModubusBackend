import { Injectable } from '@nestjs/common'
import axios from 'axios'
import { BusStationInfo } from './Dto/busStationInfo'
import { BusArrivalInfo } from './Dto/busArrivalInfo'

@Injectable()
export class BusStopApiService {
  private serviceKey = process.env.BUS_API_KEY

  // Fetches bus stations near a given GPS location
  async busToStation(
    gpsLati: number,
    gpsLong: number,
  ): Promise<BusStationInfo[]> {
    const url = `https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList?serviceKey=${this.serviceKey}&pageNo=1&numOfRows=10&_type=json&gpsLati=${gpsLati}&gpsLong=${gpsLong}`

    try {
      const response = await axios.get(url)
      const data = response.data

      const items = data.response.body.items.item

      // Convert item to array if it's not already
      const busStationItems = Array.isArray(items) ? items : [items]

      const busStationInfo: BusStationInfo[] = busStationItems.map(
        (item: any) => ({
          nodeid: item.nodeid,
          nodenm: item.nodenm,
          cityCode: item.cityCode,
        }),
      )

      return busStationInfo
    } catch (error) {
      console.error('Failed to fetch bus station information:', error)
      throw new Error('Failed to fetch bus station information')
    }
  }

  // Fetches bus arrival information for a given station
  async busArrivalInfo(
    cityCode: string,
    nodeId: string,
  ): Promise<BusArrivalInfo[]> {
    const url = `https://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList?serviceKey=${this.serviceKey}&pageNo=1&numOfRows=10&_type=json&cityCode=${cityCode}&nodeId=${nodeId}`

    try {
      const response = await axios.get(url)
      const data = response.data

      const items = data.response.body.items.item
      const busArrivalItems = Array.isArray(items) ? items : [items]

      const busArrivalInfo: BusArrivalInfo[] = busArrivalItems.map(
        (item: any) => ({
          arrprevstationcnt: item.arrprevstationcnt,
          vehicletp: item.vehicletp,
          arrtime: item.arrtime,
          routeno: item.routeno,
        }),
      )

      return busArrivalInfo
    } catch (error) {
      console.error('Failed to fetch bus arrival information:', error)
      throw new Error('Failed to fetch bus arrival information')
    }
  }

  // Provides information about the bus to board
  async BoardBusInfo(
    cityCode: string, // 정류장
    nodeId: string,
    routeId: string,
  ): Promise<BusArrivalInfo[]> {
    const serviceKey = process.env.BUS_API_KEY

    const url = `https://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoSpcifyRouteBusArvlPrearngeInfoList?serviceKey=${serviceKey}&pageNo=1&numOfRows=10&_type=json&cityCode=${cityCode}&nodeId=${nodeId}&routeId=${routeId}`

    try {
      const response = await axios.get(url)
      const data = response.data

      const item = data?.response?.body?.items?.item

      if (item) {
        const busArrivalInfos: BusArrivalInfo[] = [
          {
            arrprevstationcnt: item.arrprevstationcnt,
            vehicletp: item.routetp,
            arrtime: item.arrtime,
            routeno: item.routeno.toString(),
          },
        ]

        return busArrivalInfos
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Failed to fetch bus arrival information:', error)
      throw new Error('Failed to fetch bus arrival information')
    }
  }
  async SeoulBoardBusInfo(
    //&stId=124000414&busRouteId=100100578&ord=29
    ord: string, // 정류장
    nodeId: string,
    routeId: string,
  ): Promise<BusArrivalInfo[]> {
    const serviceKey = process.env.BUS_API_KEY

    const url = `http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRoute?serviceKey=${serviceKey}&stId=${nodeId}&busRouteId=${routeId}&ord=${ord}`

    try {
      const response = await axios.get(url)
      const data = response.data

      const item = data?.response?.body?.items?.item

      if (item) {
        const busArrivalInfos: BusArrivalInfo[] = [
          {
            // 버스 도착시간,
            arrprevstationcnt: item.arrprevstationcnt,
            vehicletp: item.routetp,
            arrtime: item.arrtime,
            routeno: item.routeno.toString(),
          },
        ]

        return busArrivalInfos
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Failed to fetch bus arrival information:', error)
      throw new Error('Failed to fetch bus arrival information')
    }
  }
}
