import { config } from 'dotenv'
config()

//console.log('API_KEY:', process.env.API_KEY) // API 키 출력

async function testBoardBusInfo() {
  const cityCode = '25' // 제공된 값 사용
  const nodeId = 'DJB8001793' // 제공된 값 사용
  const routeId = 'DJB30300002' // 제공된 값 사용

  //console.log('cityCode:', cityCode)
  //console.log('nodeId:', nodeId)
  //console.log('routeId:', routeId)

  try {
    const result = await BoardBusInfo(cityCode, nodeId, routeId)
    console.log('Bus arrival info:', result)
  } catch (error) {
    console.error('Error fetching bus info:', error)
  }
}

testBoardBusInfo()
