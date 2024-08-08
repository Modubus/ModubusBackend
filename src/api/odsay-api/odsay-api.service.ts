import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import axios from 'axios'
// API는 완성 하지만 나중에 지하철에 대한 정보도 넣어주고 기능은 버스에서 가능하게 만드는게 좋을 것 같다
interface BusRouteInfo {
  busNumber: string
  busType: string
  transferInfo?: {
    transferBusNumber: string
    transferBusStop: string
  }
}

@Injectable()
export class OdsayApiService {
  private apiKey = process.env.ODSAY_KEY

  // 주어진 좌표를 바탕으로 버스 경로를 검색하는 함수
  async searchBusRoutes(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): Promise<BusRouteInfo[]> {
    const url = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${startX}&SY=${startY}&EX=${endX}&EY=${endY}&OPT=0&SearchType=0&SearchPathType=0&apiKey=${this.apiKey}`

    try {
      const response = await axios.get(url)
      const data = response.data

      if (data.result && data.result.path) {
        const busRoutes: BusRouteInfo[] = data.result.path.map((path: any) => {
          const subPath = path.subPath.filter(
            (subPath: any) => subPath.trafficType === 2, // 버스인 경우
          )

          if (subPath.length === 0) {
            return // 가능한 경로가 없다는 결과 반환
          }

          const mainBus = subPath[0]
          const transferBus = subPath[1] || null // 환승 버스

          const busRouteInfo: BusRouteInfo = {
            busNumber: mainBus.lane[0].busNo, // 버스 노선 번호 - 꼭 lane을 배열로 적어야하나?
            busType: mainBus.lane[0].type, // 버스 타입
          }
          // 환승 버스의 정보
          if (transferBus) {
            busRouteInfo.transferInfo = {
              transferBusNumber: transferBus.lane[0].busNo,
              transferBusStop: transferBus.startName,
            }
          }

          return busRouteInfo
        })

        return busRoutes.filter((route) => route !== null)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Failed to fetch bus routes:', error)
      throw new HttpException(
        'Failed to fetch bus routes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
