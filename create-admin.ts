import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = "admin@avexora.in"
  const plainPassword = "adminPassword123!"
  const hashedPassword = await bcrypt.hash(plainPassword, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: "superadmin",
    },
    create: {
      email,
      name: "Super Admin",
      password: hashedPassword,
      role: "superadmin",
    },
  })

  console.log(`Admin user created/updated successfully!`)
  console.log(`Email: ${email}`)
  console.log(`Password: ${plainPassword}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
