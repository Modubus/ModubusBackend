import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import axios from 'axios'

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
  private apiKey: string

  constructor() {
    this.apiKey = process.env.ODSAY_KEY
  }

  // Function to search bus routes based on coordinates
  async searchBusRoutes(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): Promise<BusRouteInfo[]> {
    const url = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${startX}&SY=${startY}&EX=${endX}&EY=${endY}&OPT=0&SearchType=0&SearchPathType=0&apiKey=${this.apiKey}`
    console.log(url)
    try {
      const response = await axios.get(url)
      const data = response.data
      console.log(data)
      if (data.result && data.result.path) {
        const busRoutes: BusRouteInfo[] = data.result.path
          .map((path: any) => {
            // 필터링된 subPath 배열에서 지하철(trafficType === 1)을 제외
            const subPaths = path.subPath
              .filter((subPath: any) => subPath.trafficType === 2) // 버스만 필터링
              .slice(0, 4) // 최대 3번의 환승(버스가 4개까지 가능, 출발 버스 포함)

            if (subPaths.length === 0) {
              return null // No bus routes found in this path
            }

            // 환승 정보 수집
            let transferInfo = null
            if (subPaths.length > 1) {
              transferInfo = subPaths
                .slice(1)
                .map((subPath: any, index: number) => ({
                  transferBusNumber: subPath.lane[0].busNo,
                  transferBusStop: subPath.startName,
                }))
            }

            const mainBus = subPaths[0]
            const busRouteInfo: BusRouteInfo = {
              busNumber: mainBus.lane[0].busNo,
              busType: mainBus.lane[0].type,
              transferInfo:
                transferInfo?.length > 0 ? transferInfo[0] : undefined,
            }

            return busRouteInfo
          })
          .filter((route) => route !== null)

        return busRoutes
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error fetching bus routes:', error)
      throw new HttpException(
        'Failed to fetch bus routes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
