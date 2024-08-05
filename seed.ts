import { PrismaClient, DisableType, Require } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Creating Bus Company entries
  const donghae = await prisma.busCompany.create({
    data: {
      name: 'Donghae',
      code: 'Donghae001',
    },
  })

  const jongro = await prisma.busCompany.create({
    data: {
      name: 'Jongro',
      code: 'Jongro001',
    },
  })

  // Creating Bus entries
  await prisma.bus.createMany({
    data: [
      {
        busCompanyId: donghae.id,
        operation: true,
        vehicleno: '30가 1101',
        routnm: '12-1',
      },
      {
        busCompanyId: jongro.id,
        operation: false,
        vehicleno: '40가 2202',
        routnm: '12-2',
      },
    ],
  })

  // Creating User entries
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

  // Creating UserRequire entries
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

  // Creating UserFavorite entries
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
