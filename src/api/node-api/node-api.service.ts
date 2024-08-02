import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { lastValueFrom } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class NodeApiService {
  private readonly nodeIdByroutnm: string
  private readonly getRoute: string

  constructor(private readonly httpService: HttpService) {
    const API_KEY = process.env.API_KEY
    const API_NODE_URL = process.env.API_NODE_URL
    this.nodeIdByroutnm = `${API_NODE_URL}/getRouteNoList?serviceKey=${API_KEY}`
    this.getRoute = `${API_NODE_URL}/getRouteAcctoThrghSttnList?serviceKey=${API_KEY}`
  }

  async getRouteIdByRouteNo(routeNo: string, cityCode: string) {
    const url = `${this.nodeIdByroutnm}&pageNo=1&numOfRows=10&_type=json&cityCode=${cityCode}&routeNo=${routeNo}`
    const response = await lastValueFrom(
      this.httpService.get(url).pipe(map((response) => response.data)),
    )
    return response.response.body.items.item.find(
      (item) => item.routeno == routeNo,
    )
  }

  async getRouteDetailsByRouteId(routeId: string, cityCode: string) {
    const url = `${this.getRoute}&pageNo=1&numOfRows=10&_type=json&cityCode=${cityCode}&routeId=${routeId}`
    const response = await lastValueFrom(
      this.httpService.get(url).pipe(map((response) => response.data)),
    )
    return response.response.body.items.item.map((item) => ({
      gpslati: item.gpslati,
      gpslong: item.gpslong,
      nodeid: item.nodeid,
      nodenm: item.nodenm,
      nodeno: item.nodeno,
      nodeord: item.nodeord,
      routeid: item.routeid,
      updowncd: item.updowncd,
    }))
  }

  async getRouteDetails(routeNo: string, cityCode: string) {
    const route = await this.getRouteIdByRouteNo(routeNo, cityCode)
    if (route) {
      const details = await this.getRouteDetailsByRouteId(
        route.routeid,
        cityCode,
      )
      return details.map((item) => item.nodenm)
    }
    return null
  }
}
