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
    gpsLati: number,
    gpsLong: number,
  ): Promise<BusStationInfo[]> {
    const serviceKey = process.env.BUS_API_KEY

    const url = `https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList?serviceKey=${serviceKey}&pageNo=1&numOfRows=10&_type=json&gpsLati=${gpsLati}&gpsLong=${gpsLong}`
    console.log('qwer:', url)
    try {
      const response = await axios.get(url)
      console.log('qqqq:', response)
      const data = response.data

      const item =
        data.response.body.items.item instanceof Array
          ? data.response.body.items.item[0]
          : data.response.body.items.item

      console.log('data123:', data)
      console.log('item123', item)
      console.log('detail123', data.response.body.items)

      const busStationInfos: BusStationInfo[] = [
        {
          citycode: item.citycode,
          gpslati: item.gpslati,
          gpslong: item.gpslong,
          nodeid: item.nodeid,
          nodenm: item.nodenm,
          nodeno: item.nodeno,
        },
      ]

      console.log('busStationInfos123:', busStationInfos)

      return busStationInfos
    } catch (error) {
      console.error('Failed to fetch nearby bus stations:', error)
      throw error
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

      if (!nearbyStations.length) {
        throw new NotFoundException('No nearby bus stations found')
      }

      const firstStation = nearbyStations[0]

      const location: Location = {
        nodenm: firstStation.nodenm,
        lat: firstStation.gpslati,
        lon: firstStation.gpslong,
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
