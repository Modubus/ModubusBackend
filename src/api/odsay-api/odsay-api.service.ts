import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import axios from 'axios'
import { BusRouteInfo } from './Dto/busRouteInfo'

@Injectable()
export class OdsayApiService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.ODSAY_KEY
  }

  // Search bus routes based on start and end coordinates
  async searchBusRoutes(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): Promise<BusRouteInfo[]> {
    const url = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${startX}&SY=${startY}&EX=${endX}&EY=${endY}&OPT=0&SearchType=0&SearchPathType=2&apiKey=${this.apiKey}`
    try {
      const response = await axios.get(url)
      const data = response.data

      return this.extractBusRoutes(data)
    } catch (error) {
      throw new HttpException(
        'Failed to fetch bus routes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // Extract bus routes from API response data
  private extractBusRoutes(data: any): BusRouteInfo[] {
    if (!(data.result && data.result.path)) {
      throw new Error('Invalid response format')
    }

    return data.result.path
      .map((path: any) => this.parseBusRoute(path))
      .filter((route: BusRouteInfo) => route !== null) as BusRouteInfo[]
  }

  // Parse a single bus route and extract relevant information
  private parseBusRoute(path: any): BusRouteInfo | null {
    const subPaths = this.getBusSubPaths(path)

    if (subPaths.length === 0) {
      return null // No bus routes found
    }

    const transferInfo = this.getTransferInfo(subPaths)
    const mainBus = subPaths[0]
    const busRouteInfo: BusRouteInfo = {
      firstStartStation: path.info.firstStartStation,
      lastEndStation: path.info.lastEndStation,
      busNumber: mainBus.lane[0].busNo,
      transferInfo: transferInfo.length > 0 ? transferInfo[0] : undefined,
      totalTime: path.info.totalTime,
    }
    return busRouteInfo
  }

  // Filter out non-bus subPaths and limit to 4 total buses (main + 3 transfers)
  private getBusSubPaths(path: any): any[] {
    return path.subPath
      .filter(
        (subPath: any) =>
          subPath.trafficType === 2 && // Bus type
          (subPath.lane[0].type === 1 || // 일반
            subPath.lane[0].type === 2 || // 좌석
            subPath.lane[0].type === 3 || // 마을버스
            subPath.lane[0].type === 11 || // 간선
            subPath.lane[0].type === 12 || // 지선
            subPath.lane[0].type === 13 || // 순환
            subPath.lane[0].type === 15), // 급행
      )
      .slice(0, 5) // Maximum 4 buses (including the initial one)
  }
  // Extract transfer information if there are multiple bus routes
  private getTransferInfo(subPaths: any[]): any[] {
    return subPaths.slice(1).map((subPath: any) => ({
      transferBusNumber: subPath.lane[0].busNo,
      transferBusStop: subPath.startName,
    }))
  }
}
