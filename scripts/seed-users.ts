/**
 * Creates demo and admin users in Supabase + Prisma.
 *
 * Usage:  npx tsx scripts/seed-users.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "./_db";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS = [
  {
    email: "demo@meecard.com",
    password: "demo1234",
    displayName: "Demo User",
    isAdmin: false,
  },
  {
    email: "admin@meecard.com",
    password: "Meecard@admin2026",
    displayName: "Admin",
    isAdmin: true,
  },
];

async function main() {
  for (const user of USERS) {
    console.log(`\n--- ${user.email} ---`);

    // Check if already exists
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find((u) => u.email === user.email);

    let supabaseId: string;

    if (found) {
      supabaseId = found.id;
      console.log(`  Supabase user exists: ${supabaseId}`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.displayName },
      });
      if (error) {
        console.error(`  Failed to create Supabase user: ${error.message}`);
        continue;
      }
      supabaseId = data.user.id;
      console.log(`  Created Supabase user: ${supabaseId}`);
    }

    // Upsert Prisma user
    const appUser = await prisma.user.upsert({
      where: { supabaseId },
      update: { isAdmin: user.isAdmin, displayName: user.displayName },
      create: {
        supabaseId,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
      },
    });
    console.log(`  Prisma user id=${appUser.id}, isAdmin=${user.isAdmin}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
  }

  console.log("\n✅ Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
