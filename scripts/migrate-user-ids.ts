import { getDb } from "../server/db/connection";
import { users } from "../drizzle/schema";
import { nanoid } from "nanoid";
import { isNull, eq } from "drizzle-orm";

async function migrateUserIds() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const usersWithoutUuid = await db
    .select()
    .from(users)
    .where(isNull(users.uuid));

  console.log(`Migrating ${usersWithoutUuid.length} users to UUID...`);

  for (const user of usersWithoutUuid) {
    const uuid = nanoid();
    await db.update(users).set({ uuid }).where(eq(users.id, user.id));
    console.log(`User ${user.id} (${user.email || "no-email"}) → ${uuid}`);
  }

  console.log("✅ UUID migration complete!");
  process.exit(0);
}

migrateUserIds().catch(console.error);
