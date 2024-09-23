export interface BusRouteInfo {
  firstStartStation: string
  lastEndStation: string
  busNumber: string
  transferInfo?: {
    transferBusNumber: string
    transferBusStop: string
  }
  totalTime: number
}
