import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const LEAVE_TYPES = [
  { code: "CL", name: "Casual Leave (Full Day)", color: "#2E3F6E", quotaGroup: "CL", quotaWeight: 1, sortOrder: 1 },
  { code: "CL1", name: "Casual Leave (Morning)", color: "#3B4D82", quotaGroup: "CL", quotaWeight: 0.5, sortOrder: 2 },
  { code: "CL2", name: "Casual Leave (Afternoon)", color: "#3B4D82", quotaGroup: "CL", quotaWeight: 0.5, sortOrder: 3 },
  { code: "MED", name: "Medical Leave (Full Day)", color: "#FFFF00", quotaGroup: "MEDICAL", quotaWeight: 1, sortOrder: 4 },
  { code: "MEDH", name: "Medical Leave (Half Pay)", color: "#FFFF66", quotaGroup: "MEDICAL", quotaWeight: 0.5, sortOrder: 5 },
  { code: "MEDO", name: "Medical Leave (Without Pay)", color: "#FFEB99", quotaGroup: null, quotaWeight: 1, sortOrder: 6 },
  { code: "P", name: "Maternity / Paternity", color: "#FF7FC1", quotaGroup: null, quotaWeight: 1, sortOrder: 7 },
  { code: "Co+", name: "Compensatory Duty (days added)", color: "#F5A623", quotaGroup: "COMP", quotaWeight: 1, sortOrder: 8 },
  { code: "C-", name: "Compensation Leave (taken)", color: "#3FA9F5", quotaGroup: "COMP", quotaWeight: 1, sortOrder: 9 },
  { code: "AL", name: "Annual Leave", color: "#0099FF", quotaGroup: null, quotaWeight: 1, sortOrder: 10 },
  { code: "W", name: "Work From Home", color: "#FFC96B", quotaGroup: null, quotaWeight: 1, sortOrder: 11 },
  { code: "SL", name: "Special Leave", color: "#C2185B", quotaGroup: "SPECIAL", quotaWeight: 1, sortOrder: 12 },
  { code: "D", name: "On Duty", color: "#1E9E5A", quotaGroup: null, quotaWeight: 1, sortOrder: 13 },
  { code: "SD", name: "Study", color: "#9E9E9E", quotaGroup: null, quotaWeight: 1, sortOrder: 14 },
  { code: "LWP", name: "Leave Without Pay", color: "#7A7A7A", quotaGroup: null, quotaWeight: 1, sortOrder: 15 },
  { code: "Pre", name: "Present", color: "#FFFFFF", quotaGroup: null, quotaWeight: 0, selectable: false, sortOrder: 0 },
];

async function main() {
  for (const lt of LEAVE_TYPES) {
    await prisma.leaveType.upsert({
      where: { code: lt.code },
      update: lt,
      create: lt,
    });
  }
  console.log(`Seeded ${LEAVE_TYPES.length} leave types.`);

  const adminName = process.env.SEED_ADMIN_NAME;
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        name: adminName ?? "Admin",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    console.log(`Ensured admin account for ${adminEmail}.`);
  } else {
    console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin seed.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
