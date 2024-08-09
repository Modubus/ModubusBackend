import { Test, TestingModule } from '@nestjs/testing'
import { OdsayApiService } from './odsay-api.service'

describe('OdsayApiService', () => {
  let service: OdsayApiService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OdsayApiService],
    }).compile()

    service = module.get<OdsayApiService>(OdsayApiService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
