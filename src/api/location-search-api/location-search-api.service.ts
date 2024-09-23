import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import axios from 'axios'
import { Location } from './Dto/location.dto'

@Injectable()
export class LocationSearchApiService {
  // 주어진 Station 키워드로 장소를 검색하고, 검색된 장소의 상세 정보를 반환
  async searchPlace(Station: string): Promise<{ x: string; y: string } | null> {
    const REST_API_KEY = process.env.KAKAO_REST_API_KEY // 실제 발급받은 API 키

    const url = 'https://dapi.kakao.com/v2/local/search/address.json'
    const params = {
      analyze_type: 'similar',
      page: 1,
      size: 10,
      query: Station, // query 값을 Station으로 사용
    }

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `KakaoAK ${REST_API_KEY}`,
        },
        params: params,
      })

      // 첫 번째 결과에서 x, y만 추출해서 반환
      if (response.data.documents.length > 0) {
        const { x, y } = response.data.documents[0] // 첫 번째 문서의 x, y 좌표를 추출
        return { x, y } // x, y 좌표만 반환
      }
    } catch (error) {
      console.error('API 요청 실패:', error)
      throw error // 에러를 발생시켜 호출자가 처리할 수 있도록 함
    }
  }

  // 주어진 GPS 좌표(gpsLati, gpsLong)를 기반으로 근처 버스 정류장 정보를 반환
  async getNearbyBusStations(
    gpsLati: number,
    gpsLong: number,
  ): Promise<{ arsId: string; stationNm: string } | null> {
    const url = `http://ws.bus.go.kr/api/rest/stationinfo/getStationByPos?ServiceKey=IfJN7A3cBBPttYf%2FFcFWC8pNDT3mi3SRSsDJmyAXQAUOlqvkQhP4ggZkHzhacIhEEJzcswWo8fraVeUBAOxQng%3D%3D&tmX=${gpsLong}&tmY=${gpsLati}&radius=100&resultType=json`

    try {
      const response = await axios.get(url)
      const data = response.data

      // 첫 번째 항목이 있는지 확인하고, 있으면 해당 값을 반환
      const stationsInfo = data.msgBody.itemList.map((item: any) => ({
        stationNm: item.stationNm, // 각 항목의 stationNm
        gpsX: item.gpsX,
        gpsY: item.gpsY,
      }))
      return stationsInfo
    } catch (error) {
      console.error('Error fetching bus station info:', error)
      throw new Error('Failed to fetch bus station info')
    }
  }

  // 주어진 Station 키워드로 장소를 검색하고, 그 장소 근처의 버스 정류장을 찾아서 반환
  async performSearch(Station: string): Promise<Location> {
    try {
      const place = await this.searchPlace(Station)

      if (!place) {
        throw new NotFoundException('No places found for the given location')
      }

      const nearbyStations = await this.getNearbyBusStations(
        parseFloat(place.y),
        parseFloat(place.x),
      )

      if (!nearbyStations) {
        throw new NotFoundException('No nearby bus stations found')
      }

      const firstStation = nearbyStations[0]

      const location: Location = {
        nodenm: firstStation.stationNm,
        lat: firstStation.gpsY,
        lon: firstStation.gpsX,
      }

      return location
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      console.error('Unexpected error in performSearch:', error)
      throw new HttpException(
        'An unexpected error occurred during the search.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
