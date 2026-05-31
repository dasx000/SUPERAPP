import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import * as readline from "readline";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

async function main() {
  console.log("=== Buat Akun SUPERADMIN ===");
  const name = await ask("Nama: ");
  const email = await ask("Email: ");
  const password = await ask("Password: ");

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, password: hashed, role: "SUPERADMIN" },
    create: { name, email, password: hashed, role: "SUPERADMIN" },
  });

  console.log(`\nSUPERADMIN berhasil dibuat: ${user.email}`);
  rl.close();
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
