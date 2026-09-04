import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
  },
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_EMAIL = "felipe@clustermedia.cl";
const ADMIN_PASSWORD = "admin12345";
const ADMIN_NAME = "Felipe Salamanca";

const ACCOUNTS = [
  { name: "CHC", color: "#E53935", currency: "CLP" as const },
  { name: "LINK USS", color: "#1E88E5", currency: "CLP" as const },
  { name: "VITEPAL", color: "#43A047", currency: "USD" as const },
  { name: "NORVIAL", color: "#8E24AA", currency: "CLP" as const },
  { name: "KIBO", color: "#F4511E", currency: "CLP" as const },
  { name: "ATRIO", color: "#039BE5", currency: "USD" as const },
];

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Create admin user in Supabase Auth
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  let authUser = existingUsers?.users?.find((u) => u.email === ADMIN_EMAIL);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw new Error(`Auth error: ${error.message}`);
    authUser = data.user;
    console.log(`  ✓ Created auth user: ${ADMIN_EMAIL}`);
  } else {
    console.log(`  → Auth user already exists: ${ADMIN_EMAIL}`);
  }

  // 2. Create admin user in DB
  const dbUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      id: authUser!.id,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      role: "admin",
    },
  });
  console.log(`  ✓ DB user: ${dbUser.name} (${dbUser.role})`);

  // 3. Create accounts (skip if already exist)
  for (const acc of ACCOUNTS) {
    const existing = await prisma.account.findFirst({
      where: { name: acc.name },
    });
    if (!existing) {
      await prisma.account.create({
        data: {
          name: acc.name,
          color: acc.color,
          currency: acc.currency,
          createdBy: dbUser.id,
        },
      });
    }
  }
  const accounts = await prisma.account.findMany();
  console.log(`  ✓ ${accounts.length} accounts`);

  // 4. Create budget plans for current month
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const budgetData = [
    { platform: "meta_ads" as const, amounts: [3500000, 2800000, 12000, 1500000, 800000, 8500] },
    { platform: "google_ads" as const, amounts: [2200000, 1600000, 9500, 900000, 500000, 6200] },
  ];

  for (const bd of budgetData) {
    for (let i = 0; i < accounts.length; i++) {
      const acc = accounts[i];
      const amount = bd.amounts[i] ?? 1000000;
      const currency = acc.currency === "USD" ? "USD" : "CLP";

      await prisma.budgetPlan.upsert({
        where: {
          accountId_platform_month_year: {
            accountId: acc.id,
            platform: bd.platform,
            month,
            year,
          },
        },
        update: { plannedAmount: amount },
        create: {
          accountId: acc.id,
          platform: bd.platform,
          month,
          year,
          plannedAmount: amount,
          currency,
          createdBy: dbUser.id,
        },
      });
    }
  }
  console.log(`  ✓ Budget plans for ${month}/${year}`);

  // 5. Sample platform connections (dummy tokens — won't actually sync)
  for (const acc of accounts) {
    for (const platform of ["meta_ads", "google_ads"] as const) {
      const existing = await prisma.platformConnection.findFirst({
        where: { accountId: acc.id, platform },
      });
      if (!existing) {
        await prisma.platformConnection.create({
          data: {
            accountId: acc.id,
            platform,
            externalAccountId:
              platform === "meta_ads"
                ? `act_${100000000 + Math.floor(Math.random() * 900000000)}`
                : `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
            accessToken: "DEMO_TOKEN_REPLACE_ME",
            lastSyncStatus: "pending",
          },
        });
      }
    }
  }
  console.log(`  ✓ Platform connections (demo tokens)`);

  // 6. Sample spend records for the current month (simulate ~27 days of spend)
  const daysToSeed = Math.min(now.getDate(), 27);
  for (const acc of accounts) {
    for (const platform of ["meta_ads", "google_ads"] as const) {
      const plan = await prisma.budgetPlan.findUnique({
        where: {
          accountId_platform_month_year: {
            accountId: acc.id,
            platform,
            month,
            year,
          },
        },
      });
      if (!plan) continue;
      const dailyBudget = Number(plan.plannedAmount) / 30;

      for (let day = 1; day <= daysToSeed; day++) {
        const variance = 0.7 + Math.random() * 0.6;
        const spend = Math.round(dailyBudget * variance * 100) / 100;
        const dateObj = new Date(year, month - 1, day);

        await prisma.spendRecord.upsert({
          where: {
            accountId_platform_date_source: {
              accountId: acc.id,
              platform,
              date: dateObj,
              source: "api_sync",
            },
          },
          update: { amountSpent: spend },
          create: {
            accountId: acc.id,
            platform,
            date: dateObj,
            amountSpent: spend,
            currency: acc.currency,
            impressions: BigInt(Math.floor(1000 + Math.random() * 50000)),
            clicks: Math.floor(50 + Math.random() * 2000),
            source: "api_sync",
          },
        });
      }
    }
  }
  console.log(`  ✓ Spend records: ${daysToSeed} days × ${accounts.length} accounts × 2 platforms`);

  // 7. Exchange rate
  await prisma.exchangeRate.upsert({
    where: {
      fromCurrency_toCurrency_month_year: {
        fromCurrency: "USD",
        toCurrency: "CLP",
        month,
        year,
      },
    },
    update: { rate: 920 },
    create: {
      fromCurrency: "USD",
      toCurrency: "CLP",
      month,
      year,
      rate: 920,
      createdBy: dbUser.id,
    },
  });
  console.log(`  ✓ Exchange rate: 1 USD = 920 CLP (${month}/${year})`);

  console.log("\n✅ Seed complete!");
  console.log(`\n  Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
