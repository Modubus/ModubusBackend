export class ReserveBusRequest {
  startStation: string // 출발 정류장 이름
  endStation: string // 도착 정류장 이름
  vehicleno: string // 차량 번호
  userId: number // 사용자 ID
}
