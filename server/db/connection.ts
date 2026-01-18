import { drizzle } from "drizzle-orm/mysql2";
import * as mysql from "mysql2/promise";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Parse DATABASE_URL to create connection pool
      const url = new URL(process.env.DATABASE_URL);
      const connectionConfig = {
        host: url.hostname || "localhost",
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        multipleStatements: false,
        supportBigNumbers: true,
        bigNumberStrings: false,
        ssl: {
          rejectUnauthorized: true,
        },
      };

      _pool = mysql.createPool(connectionConfig) as unknown as Exclude<
        typeof _pool,
        null
      >;
      _db = drizzle(_pool) as unknown as typeof _db;
      console.log("[Database] Connection pool created successfully");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
