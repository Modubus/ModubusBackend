import { BusStopApiService } from './../bus-stop-api/bus-stop-api.service'
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import axios from 'axios'
import { AddressDTO } from './Dto/address.dto'
import { BusStop } from './Dto/bus-stop.dto'
import { Location } from './Dto/location.dto'
import { BusStationInfo } from './Dto/busStationInfo'
import * as https from 'https'

@Injectable()
export class LocationSearchApiService {
  private busStops: BusStop[] = []
  // 주어진 Station 키워드로 장소를 검색하고, 검색된 장소의 상세 정보를 반환
  async searchPlace(Station: string) {
    console.log('Station:', Station)

    if (!Station.replace(/^\s+|\s+$/g, '')) {
      throw new NotFoundException(`Station is empty`)
    }
    const url = `https://nominatim.openstreetmap.org/search?q=${Station}&format=json&addressdetails=1&limit=5`
    console.log('searchPlaceUrl:', url)

    try {
      const agent = new https.Agent({
        family: 4,
      }) // Ipv4로만 호출하게 만듬 - Ipv6 XX

      const response = await axios.get(url, {
        httpsAgent: agent,
      })
      console.log('resSearch:', response.data)
      const data = response.data

      return data.map((place: any) => ({
        display_name: place.display_name,
        lat: parseFloat(place.lat),
        lon: parseFloat(place.lon),
        address: place.address,
      }))
    } catch (error) {
      console.error('Error in searchPlace:', error)
      return []
    }
  }

  // 주어진 AddressDTO 객체를 JSON 문자열로 변환하여 반환
  async jsonAddress(address: AddressDTO): Promise<string> {
    if (!address) {
      throw new Error('Address information was not provided.')
    }

    return JSON.stringify({
      road: address.road,
      city: address.city,
      state: address.state,
      country: address.country,
    })
  }

  // 주어진 GPS 좌표(gpsLati, gpsLong)를 기반으로 근처 버스 정류장 정보를 반환
  async getNearbyBusStations(
    // getNearbyBusStations 서울 버전
    gpsLati: number,
    gpsLong: number,
  ): Promise<{ arsId: string; stationNm: string } | null> {
    const url = `http://ws.bus.go.kr/api/rest/stationinfo/getStationByPos?ServiceKey=IfJN7A3cBBPttYf%2FFcFWC8pNDT3mi3SRSsDJmyAXQAUOlqvkQhP4ggZkHzhacIhEEJzcswWo8fraVeUBAOxQng%3D%3D&tmX=${gpsLong}&tmY=${gpsLati}&radius=100&resultType=json`

    try {
      const response = await axios.get(url)
      const data = response.data

      // 첫 번째 항목이 있는지 확인하고, 있으면 해당 값을 반환
      console.log('data', data)
      const stationsInfo = data.msgBody.itemList.map((item: any) => ({
        stationNm: item.stationNm, // 각 항목의 stationNm
        gpsX: item.gpsX,
        gpsY: item.gpsY,
      }))
      console.log('stationsInfo', stationsInfo)
      return stationsInfo
    } catch (error) {
      console.error('Error fetching bus station info:', error)
      throw new Error('Failed to fetch bus station info')
    }
  }

  // 주어진 Station 키워드로 장소를 검색하고, 그 장소 근처의 버스 정류장을 찾아서 반환
  async performSearch(Station: string): Promise<Location> {
    try {
      console.log('startStation', Station)
      const places = await this.searchPlace(Station)
      console.log('palce123:', places)

      if (!places.length) {
        throw new NotFoundException('No places found for the given location')
      }

      const firstPlace = places[0]

      console.log('firstPlace:', firstPlace)
      const nearbyStations = await this.getNearbyBusStations(
        firstPlace.lat,
        firstPlace.lon,
      )

      console.log('nearbyStation', nearbyStations)

      if (!nearbyStations) {
        throw new NotFoundException('No nearby bus stations found')
      }

      const firstStation = nearbyStations[0]

      const location: Location = {
        nodenm: firstStation.stationNm,
        lat: firstStation.gpsY,
        lon: firstStation.gpsX,
      }

      console.log('location', location)

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
