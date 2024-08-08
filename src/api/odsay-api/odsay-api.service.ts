import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import axios from 'axios'

interface BusRouteInfo {
  busNumber: string
  busType: string
  transferInfo?: {
    transferBusNumber: string
    transferBusStop: string
  }
  arrivalTime: string
}

@Injectable()
export class OdsayApiService {
  private apiKey = process.env.ODSAY_KEY
  async searchBusRoutes(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): Promise<BusRouteInfo[]> {
    const url = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${startX}&SY=${startY}&EX=${endX}&EY=${endY}&OPT=0&SearchType=0&SearchPathType=0&apiKey=${this.apiKey}`

    console.log('Request URL for searchBusRoutes:', url)

    try {
      const response = await axios.get(url)
      const data = response.data

      console.log(
        'Response data from searchBusRoutes:',
        JSON.stringify(data, null, 2),
      )

      if (data.result && data.result.path) {
        const busRoutes: BusRouteInfo[] = data.result.path.map((path: any) => {
          const subPath = path.subPath.filter(
            (subPath: any) => subPath.trafficType === 2, // 버스인 경우
          )

          if (subPath.length === 0) {
            return null
          }

          const mainBus = subPath[0]
          const transferBus = subPath[1] || null

          const busRouteInfo: BusRouteInfo = {
            busNumber: mainBus.lane[0].busNo,
            busType: mainBus.lane[0].type,
            arrivalTime: new Date(
              path.info.firstStartTime * 1000,
            ).toISOString(),
          }

          if (transferBus) {
            busRouteInfo.transferInfo = {
              transferBusNumber: transferBus.lane[0].busNo,
              transferBusStop: transferBus.startName,
            }
          }

          return busRouteInfo
        })

        console.log(
          'Parsed bus route info:',
          busRoutes.filter((route) => route !== null),
        )

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
