import { Client } from "pg";
import bcrypt from "bcryptjs";
import * as readline from "readline";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log("=== Buat Akun SUPERADMIN ===");
  const name = await ask("Nama: ");
  const email = await ask("Email: ");
  const password = await ask("Password: ");

  const hashed = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();

  await client.query(
    `INSERT INTO "User" (id, name, email, password, role, "createdAt")
     VALUES ($1, $2, $3, $4, 'SUPERADMIN', NOW())
     ON CONFLICT (email) DO UPDATE SET name=$2, password=$4, role='SUPERADMIN'`,
    [id, name, email, hashed]
  );

  console.log(`\nSUPERADMIN berhasil dibuat: ${email}`);
  rl.close();
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
