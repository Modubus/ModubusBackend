import { PrismaClient, DisableType, Require } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 버스 회사 데이터 삽입
  const busCompanyDonghae = await prisma.busCompany.create({
    data: {
      name: 'Donghae',
    },
  })

  const busCompanyJongro = await prisma.busCompany.create({
    data: {
      name: 'Jongro',
    },
  })

  // 버스 데이터 삽입
  await prisma.bus.createMany({
    data: [
      {
        id: 1,
        code: '12345',
        vehicleno: '30가 1101',
        routhnm: '12-1',
        operation: true,
        busCompanyId: busCompanyDonghae.id,
      },
      {
        id: 2,
        code: '54321',
        vehicleno: '40가 2202',
        routhnm: '12-2',
        operation: false,
        busCompanyId: busCompanyJongro.id,
      },
    ],
  })

  // 유저 데이터 삽입
  const user1 = await prisma.user.create({
    data: {
      username: 'user1',
      password: 'password1',
      email: 'user1@example.com',
      disableType: DisableType.OLD,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      username: 'user2',
      password: 'password2',
      email: 'user2@example.com',
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
        routnm: '92-1',
        nodeId: 'node123',
        userId: user1.id,
      },
      {
        routnm: '100',
        nodeId: 'node456',
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
