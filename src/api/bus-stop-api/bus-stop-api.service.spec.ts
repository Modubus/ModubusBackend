import { Test, TestingModule } from '@nestjs/testing'
import { BusStopApiService } from './bus-stop-api.service'

describe('ApiService', () => {
  let service: BusStopApiService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusStopApiService],
    }).compile()

    service = module.get<BusStopApiService>(BusStopApiService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
