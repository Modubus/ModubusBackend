export interface BusCompany {
  id: number
  companyName: companyName
  companyCode: string // 버스회사 인증용 코드
}

export enum companyName { // 위치 변경 예정??
  HOG = 'HOG',
}
