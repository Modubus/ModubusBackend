import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import axios from 'axios'
import { BusRouteInfo } from './Dto/busRouteInfo'

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
    const url = this.buildApiUrl(startX, startY, endX, endY)

    try {
      const response = await axios.get(url)
      const data = response.data

      if (this.isValidResponse(data)) {
        return this.parseBusRoutes(data.result.path)
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

  // API URL을 생성하는 함수
  private buildApiUrl(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): string {
    return `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${startX}&SY=${startY}&EX=${endX}&EY=${endY}&OPT=0&SearchType=0&SearchPathType=0&apiKey=${this.apiKey}`
  }

  // API 응답 형식이 유효한지 확인하는 함수
  private isValidResponse(data: any): boolean {
    return data && data.result && data.result.path
  }

  // 버스 경로 데이터를 파싱하는 함수
  private parseBusRoutes(paths: any[]): BusRouteInfo[] {
    return paths
      .map((path: any) => this.extractBusRouteInfo(path))
      .filter((route) => route !== null)
  }

  // 개별 경로에서 버스 정보를 추출하는 함수
  private extractBusRouteInfo(path: any): BusRouteInfo | null {
    const busSubPaths = path.subPath.filter(
      (subPath: any) => subPath.trafficType === 2, // 버스 경로만 필터링
    )

    if (busSubPaths.length === 0) {
      return null // 버스 경로가 없는 경우
    }

    const mainBus = busSubPaths[0]
    const transferBus = busSubPaths[1] || null

    const busRouteInfo: BusRouteInfo = {
      busNumber: mainBus.lane[0].busNo, // 버스 노선 번호
      busType: mainBus.lane[0].type, // 버스 타입
      totalTime: path.info.totalTime, // 총 소요 시간
    }

    // 환승 버스 정보가 있을 경우
    if (transferBus) {
      busRouteInfo.transferInfo = {
        transferBusNumber: transferBus.lane[0].busNo,
        transferBusStop: transferBus.startName,
      }
    }

    return busRouteInfo
  }
}
