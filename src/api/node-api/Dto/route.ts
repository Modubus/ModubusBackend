export interface RouteDetail {
  nodenm: string // 기존에 있던 정류장 이름
  stationId?: string // 정류장 ID 추가 (옵셔널)
}

export interface Route {
  routeNo: string
  stops: RouteDetail[]
}

export interface RouteInfo {
  routeNo: string
  cityCode: string
}

export interface RouteItem {
  routeid: string
}
