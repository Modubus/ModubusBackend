import { Passenger } from './passengers'

export interface BoardingInfo {
  station: station // 이전 도착 정류장
  passengers: Passenger[] // 출발 정류장 별 인원 파악
  upcomingPassengers: numPassengerByStation[] // 정류장별 대기 인원 수
}

type numPassengerByStation = {
  station: string
  stationId: string
}

type station = {
  currentStationId: string | null
  futureStationId: string | null
}
