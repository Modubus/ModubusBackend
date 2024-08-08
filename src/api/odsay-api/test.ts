import { config } from 'dotenv'
config()
import { OdsayApiService } from './odsay-api.service'

// OdsayApiService 테스트 함수
async function testSearchBusRoutes() {
  const odsayApiService = new OdsayApiService()

  const startX = 127.02761 // 예시 시작 X 좌표 (경도)
  const startY = 37.497942 // 예시 시작 Y 좌표 (위도)
  const endX = 127.037628 // 예시 도착 X 좌표 (경도)
  const endY = 37.500792 // 예시 도착 Y 좌표 (위도)

  console.log('Starting searchBusRoutes test...')
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

// 테스트 함수 실행
testSearchBusRoutes()
