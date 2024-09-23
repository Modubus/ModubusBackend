export interface BusRouteInfo {
  busNumber: string
  busType: string
  transferInfo?: {
    transferBusNumber: string
    transferBusStop: string
  }
  totalTime: number
}
