import { PrismaClient, DisableType, Require } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 기존 데이터 삭제
  await prisma.userRequire.deleteMany({})
  await prisma.userFavorite.deleteMany({})
  await prisma.boarding.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.bus.deleteMany({})
  await prisma.busCompany.deleteMany({})

  // 버스 회사 데이터
  const companies = [
    { name: 'Yuseong', code: 'Yuseong', cityCode: '21' },
    { name: 'Sinchon', code: 'Sinchon', cityCode: '21' },
    { name: 'Shinil', code: 'Shinil', cityCode: '21' },
    { name: 'Paju', code: 'Paju', cityCode: '21' },
  ]

  // 회사 코드 생성 및 데이터 삽입
  const companyData = await Promise.all(
    companies.map(async (company) => {
      return await prisma.busCompany.create({
        data: {
          name: company.name,
          code: company.code,
          cityCode: company.cityCode,
        },
      })
    }),
  )

  const yuseong = companyData.find((company) => company.name === 'Yuseong')
  const sinchon = companyData.find((company) => company.name === 'Sinchon')
  const shinil = companyData.find((company) => company.name === 'Shinil')
  const paju = companyData.find((company) => company.name === 'Paju')

  // 버스 데이터 삽입
  await prisma.bus.createMany({
    data: [
      {
        busCompanyId: yuseong!.id,
        operation: false,
        vehicleno: '서울74사5366',
        routnm: '140',
      },
      {
        busCompanyId: yuseong!.id,
        operation: false,
        vehicleno: '서울74사7241',
        routnm: '7013A',
      },
      {
        busCompanyId: sinchon!.id,
        operation: false,
        vehicleno: '서울74사7392',
        routnm: '750B',
      },
      {
        busCompanyId: sinchon!.id,
        operation: false,
        vehicleno: '서울70사7780',
        routnm: '750A',
      },
      {
        busCompanyId: shinil!.id,
        operation: false,
        vehicleno: '서울74사3891',
        routnm: '140',
      },
      {
        busCompanyId: shinil!.id,
        operation: false,
        vehicleno: '서울71사1287',
        routnm: '140',
      },
      {
        busCompanyId: paju!.id,
        operation: false,
        vehicleno: '서울74사3097',
        routnm: '140',
      },
      {
        busCompanyId: paju!.id,
        operation: false,
        vehicleno: '서울71사1861',
        routnm: '140',
      },
    ],
  })

  // 유저 데이터 삽입
  const user1 = await prisma.user.create({
    data: {
      fingerprint: 'fingerprint_user1',
      disableType: DisableType.OLD,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      fingerprint: 'fingerprint_user2',
      disableType: DisableType.PSC,
    },
  })

  // 유저 요구사항 데이터 삽입
  await prisma.userRequire.createMany({
    data: [
      {
        require: Require.SLOWER,
        userId: user1.id,
      },
      {
        require: Require.WHEELCHAIR,
        userId: user2.id,
      },
    ],
  })

  // 유저 즐겨찾기 데이터 삽입
  await prisma.userFavorite.createMany({
    data: [
      {
        routnm: '92',
        startNodeId: 'start_node123',
        endNodeId: 'end_node123',
        userId: user1.id,
      },
      {
        routnm: '100',
        startNodeId: 'start_node456',
        endNodeId: 'end_node456',
        userId: user2.id,
      },
    ],
  })

  console.log('Dummy data inserted successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
