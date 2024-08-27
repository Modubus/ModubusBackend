import { Passenger } from './passengers'

export interface BoardingInfo {
  requires: string[]
  currentStation: string // 이전 도착 정류장
  CurrentPassengers: Passenger[] // 출발 정류장 별 인원 파악
  futurePassengers: numPassengerByStation
}

type numPassengerByStation = {
  station: string
  count: number
}
