import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { lastValueFrom } from 'rxjs'
import * as dotenv from 'dotenv'

dotenv.config({ path: './.env.development' })

@Injectable()
export class ApiService {
  private readonly busRouteUrl: string
  private readonly cityCodeUrl: string

  constructor(private readonly httpService: HttpService) {
    const API_KEY = process.env.API_KEY
    const API_URL = process.env.API_URL
    this.busRouteUrl = `${API_URL}/getRouteAcctoBusLcList?serviceKey=${API_KEY}&_type=json`
    this.cityCodeUrl = `${API_URL}/getCtyCodeList?serviceKey=${API_KEY}`
  } // 데이터는 json으로 고정

  async getBusRouteData(
    routeId: string,
    cityCode: string,
    pageNo: number = 1,
    numOfRows: number = 1000,
    // 1. 마지막 페이지 작성 - 정확한 정보를 찾아야함
    // 2. 페이지네이션 방식 - 데이터 받아오는 것이 오래걸림
  ): Promise<any> {
    const url = `${this.busRouteUrl}&routeId=${routeId}&cityCode=${cityCode}&pageNo=${pageNo}&numOfRows=${numOfRows}`
    const response = await lastValueFrom(
      this.httpService.get(url, { timeout: 5000 }),
    )
    return response.data
  }

  async getNodesByRouteNm(
    routeNm: string,
    routeId: string,
    cityCodes: string[],
  ): Promise<{ routenm: string; nodenm: string }[]> {
    const allData = []

    for (const cityCode of cityCodes) {
      // 이부분을 더 효율적으로 하고 싶음
      const data = await this.getBusRouteData(routeId, cityCode)
      if (data.response.body.items.item) {
        const nodes = data.response.body.items.item
        allData.push(...nodes)
      }
    }

    return allData
      .filter((node) => node.routenm === routeNm)
      .map((node) => ({ routenm: node.routenm, nodenm: node.nodenm }))
  }

  // 도시 코드 목록을 가져오는 메서드
  async getCityCodes(): Promise<{ citycode: string; cityname: string }[]> {
    const url = `${this.cityCodeUrl}&_type=json`
    const response = await lastValueFrom(
      this.httpService.get(url, { timeout: 5000 }),
    )
    return response.data.response.body.items.item
  }
}
