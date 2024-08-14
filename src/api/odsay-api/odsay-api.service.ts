import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import axios from 'axios'
// API는 완성?은 사실 아니고 버스만 나오게 하니까 지하철에 대한 경로가 빠져서 조금 이상하게 나옴 나중에 지하철에 대한 정보도 넣어주고 기능은 버스에서 가능하게 만드는게 좋을 것 같다
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
  private apiKey =
    process.env.APP_ENV === 'PROD'
      ? process.env.ODSAY_KEY_PROD
      : process.env.ODSAY_KEY_LOCAL

  // 주어진 좌표를 바탕으로 버스 경로를 검색하는 함수
  async searchBusRoutes(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): Promise<BusRouteInfo[]> {
    const url = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${startX}&SY=${startY}&EX=${endX}&EY=${endY}&OPT=0&SearchType=0&SearchPathType=0&apiKey=${this.apiKey}`
    console.log('Constructed URL:', url) // URL 생성 로그

    try {
      console.log('Fetching bus routes from API...')
      const response = await axios.get(url)
      console.log('API response received:', response.data) // API 응답 로그

      const data = response.data

      if (data.result && data.result.path) {
        console.log('Parsing bus routes...')
        const busRoutes: BusRouteInfo[] = data.result.path.map(
          (path: any, pathIndex: number) => {
            console.log(`Processing path #${pathIndex}:`, path) // 각 경로 처리 로그

            const subPath = path.subPath.filter(
              (subPath: any) => subPath.trafficType === 2, // 버스인 경우
            )
            console.log('Filtered bus subPath:', subPath) // 필터링된 버스 서브패스 로그

            if (subPath.length === 0) {
              console.log('No bus routes found for this path.')
              return null // 가능한 경로가 없다는 결과 반환
            }

            const mainBus = subPath[0]
            console.log('Main bus info:', mainBus) // 주요 버스 정보 로그

            const transferBus = subPath[1] || null // 환승 버스
            console.log('Transfer bus info:', transferBus) // 환승 버스 정보 로그

            const busRouteInfo: BusRouteInfo = {
              busNumber: mainBus.lane[0].busNo, // 버스 노선 번호
              busType: mainBus.lane[0].type, // 버스 타입
            }
            console.log('Bus route info created:', busRouteInfo) // 생성된 버스 경로 정보 로그

            // 환승 버스의 정보
            if (transferBus) {
              busRouteInfo.transferInfo = {
                transferBusNumber: transferBus.lane[0].busNo,
                transferBusStop: transferBus.startName,
              }
              console.log(
                'Transfer info added to route:',
                busRouteInfo.transferInfo,
              ) // 환승 정보 로그
            }

            return busRouteInfo
          },
        )

        const filteredBusRoutes = busRoutes.filter((route) => route !== null)
        console.log('Filtered bus routes:', filteredBusRoutes) // 필터링된 버스 경로 로그

        return filteredBusRoutes
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
