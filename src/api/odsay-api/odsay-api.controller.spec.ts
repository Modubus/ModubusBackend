import { Test, TestingModule } from '@nestjs/testing'
import { OdsayApiController } from './odsay-api.controller'

describe('OdsayApiController', () => {
  let controller: OdsayApiController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OdsayApiController],
    }).compile()

    controller = module.get<OdsayApiController>(OdsayApiController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
