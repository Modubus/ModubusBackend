import { config } from 'dotenv'
config()

import { OdsayApiService } from './odsay-api.service'

// 테스트 함수를 정의
async function testSearchBusRoutes() {
  const odsayApiService = new OdsayApiService()

  // 테스트할 좌표 설정
  const startX = 126.923511 // 시작 지점의 경도
  const startY = 37.512462 // 시작 지점의 위도
  const endX = 126.955397 // 도착 지점의 경도
  const endY = 37.602579 // 도착 지점의 위도

  console.log('Testing searchBusRoutes...')
  console.log('Parameters:', { startX, startY, endX, endY })

  try {
    const busRoutes = await odsayApiService.searchBusRoutes(
      startX,
      startY,
      endX,
      endY,
    )
    console.log('Bus Routes:', busRoutes)
  } catch (error) {
    console.error('Error fetching bus routes:', error.message)
  }
}

// 테스트 함수 호출
testSearchBusRoutes()
