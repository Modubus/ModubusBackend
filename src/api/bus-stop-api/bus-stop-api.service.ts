import { Injectable } from '@nestjs/common'
import axios from 'axios'
import { BoardingInfo } from './Dto/busArrivalInfo'
import { BusArrivalInfo } from './Dto/busArriveInfo'
import { BusesArrivalInfo } from './Dto/busesArrivalInfo'
import { StationIdInfo } from './Dto/stationIdInfo'

@Injectable()
export class BusStopApiService {
  // private serviceKey = process.env.BUS_API_KEY

  // Fetches bus stations near a given GPS location
  async busToStation(
    gpsLati: number,
    gpsLong: number,
  ): Promise<StationIdInfo[]> {
    const url = `http://ws.bus.go.kr/api/rest/stationinfo/getStationByPos?ServiceKey=${process.env.BUS_API_KEY}&tmX=${gpsLong}&tmY=${gpsLati}&radius=500&resultType=json`

    try {
      const response = await axios.get(url)
      const data = response.data

      const stationsInfo: StationIdInfo[] = data.msgBody.itemList.map(
        (item: any) => ({
          arsId: item.arsId,
          stationNm: item.stationNm,
          stationId: item.stationId,
        }),
      )
      return stationsInfo
    } catch (error) {
      console.error('Error fetching bus station info:', error)
      throw new Error('Failed to fetch bus station info')
    }
  }

  // Fetches bus arrival information for a given station
  async busArrivalInfo(arsId: string): Promise<BusArrivalInfo[]> {
    const url = `http://ws.bus.go.kr/api/rest/stationinfo/getStationByUid?ServiceKey=${process.env.BUS_API_KEY}&arsId=${arsId}&resultType=json`
    console.log('url', url)
    try {
      const response = await axios.get(url)
      const data = response.data

      // 필요한 데이터를 추출
      const items = data.msgBody.itemList

      // 필요한 정보를 배열로 변환
      const busInfo: BusArrivalInfo[] = items.map((item) => ({
        staOrd: item.staOrd, // ord 번호
        busRouteId: item.busRouteId, // 노선 번호
        arrmsg1: item.arrmsg1, // 도착정보
        rtNm: item.rtNm, // 노선 명
      }))

      return busInfo
    } catch (error) {
      console.error('Failed to fetch bus station information:', error)
      throw new Error('Failed to fetch bus station information')
    }
  }

  // Provides information about the bus to board
  async BoardBusInfo(
    cityCode: string, // 정류장
    nodeId: string,
    routeId: string,
  ): Promise<BoardingInfo[]> {
    const serviceKey = process.env.BUS_API_KEY

    const url = `https://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoSpcifyRouteBusArvlPrearngeInfoList?serviceKey=${serviceKey}&pageNo=1&numOfRows=10&_type=json&cityCode=${cityCode}&nodeId=${nodeId}&routeId=${routeId}`

    try {
      const response = await axios.get(url)
      const data = response.data

      const item = data?.response?.body?.items?.item

      if (item) {
        const busArrivalInfos: BoardingInfo[] = [
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
    ord: number, // 정류장 순번
    stId: string, // 정류소 고유 ID
    routeId: string, // 버스 노선 ID
  ): Promise<BusesArrivalInfo> {
    const serviceKey = process.env.BUS_API_KEY // 환경 변수에서 API 키 로드

    const url = `http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRoute?serviceKey=${serviceKey}&stId=${stId}&busRouteId=${routeId}&ord=${ord}&resultType=json`

    try {
      const response = await axios.get(url)

      // JSON 형식 데이터 처리
      const result = response.data

      // msgBody와 itemList에서 데이터를 추출
      const itemList = result.msgBody.itemList[0]

      if (itemList) {
        // 버스 도착 정보를 반환
        const busArrivalInfos: BusesArrivalInfo = {
          arrmsg1: itemList.arrmsg1, // 첫번째 버스 도착시간
          busId1: itemList.vehId1,
          vehicleno1: itemList.plainNo1,
          arrmsg2: itemList.arrmsg2, // 두번째 버스 도착시간
          busId2: itemList.vehId2,
          vehicleno2: itemList.plainNo2,
          busRouteAbrv: itemList.busRouteAbrv, // 버스 노선 약어
          busType1: itemList.busType1, // 노선 타입
          busType2: itemList.busType2,
        }
        return busArrivalInfos
      } else {
        throw new Error('No bus arrival information found')
      }
    } catch (error) {
      console.error('Failed to fetch bus arrival information:', error)
      throw new Error('Failed to fetch bus arrival information')
    }
  }
}
