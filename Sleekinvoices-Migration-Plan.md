 Here is Claude's plan:                                                                                                                                   
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Migration Plan: Manus OAuth → Auth.js + PlanetScale + Vercel                                                                                             
                                                                                                                                                          
 Executive Summary                                                                                                                                        
                                                                                                                                                          
 Objective: Replace Manus OAuth dependency with Auth.js (Google + GitHub), migrate database to PlanetScale, and deploy to Vercel.                         
                                                                                                                                                          
 Current State:                                                                                                                                           
 - Auth: Manus OAuth with JWT sessions                                                                                                                    
 - Database: MySQL with 43 tables, integer IDs                                                                                                            
 - Hosting: Custom Express + Vite                                                                                                                         
                                                                                                                                                          
 Target State:                                                                                                                                            
 - Auth: Auth.js v5 with Google + GitHub OAuth (JWT sessions)                                                                                             
 - Database: PlanetScale (MySQL-compatible) with UUID user IDs                                                                                            
 - Hosting: Vercel                                                                                                                                        
                                                                                                                                                          
 Complexity: High (multi-day project)                                                                                                                     
 Downtime: 1-2 hours during DNS cutover                                                                                                                   
 Timeline: 5-7 days                                                                                                                                       
                                                                                                                                                          
 ---                                                                                                                                                      
 Architecture Changes                                                                                                                                     
                                                                                                                                                          
 Authentication Flow Transformation                                                                                                                       
                                                                                                                                                          
 Before (Manus):                                                                                                                                          
 User → Login → Manus OAuth → Callback → JWT → Session                                                                                                    
                                                                                                                                                          
 After (Auth.js):                                                                                                                                         
 User → Login → Auth.js (Google/GitHub) → Callback → JWT → Session                                                                                        
                                                                                                                                                          
 Key Difference: No custom OAuth server, Auth.js handles everything                                                                                       
                                                                                                                                                          
 ---                                                                                                                                                      
 Phase 1: Preparation (Day 1, 4 hours)                                                                                                                    
                                                                                                                                                          
 1.1 Create Migration Branch                                                                                                                              
                                                                                                                                                          
 git checkout -b feature/authjs-planetscale-migration                                                                                                     
 git checkout -b backup/pre-migration-snapshot                                                                                                            
 git checkout feature/authjs-planetscale-migration                                                                                                        
                                                                                                                                                          
 1.2 Backup Database                                                                                                                                      
                                                                                                                                                          
 mysqldump -u root -p sleekinvoices_dev > backup_$(date +%Y%m%d).sql                                                                                      
 # Save to cloud storage (DO NOT SKIP)                                                                                                                    
                                                                                                                                                          
 1.3 Set Up OAuth Providers                                                                                                                               
                                                                                                                                                          
 Google OAuth:                                                                                                                                            
 1. Go to https://console.cloud.google.com/apis/credentials                                                                                               
 2. Create OAuth 2.0 credentials                                                                                                                          
 3. Authorized redirect URI: https://your-domain.com/api/auth/callback/google                                                                             
 4. Save: AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET                                                                                                              
                                                                                                                                                          
 GitHub OAuth:                                                                                                                                            
 1. Go to https://github.com/settings/developers                                                                                                          
 2. Register new OAuth App                                                                                                                                
 3. Authorization callback URL: https://your-domain.com/api/auth/callback/github                                                                          
 4. Save: AUTH_GITHUB_ID, AUTH_GITHUB_SECRET                                                                                                              
                                                                                                                                                          
 ---                                                                                                                                                      
 Phase 2: Database Schema Changes (Day 1-2, 6 hours)                                                                                                      
                                                                                                                                                          
 2.1 Add Auth.js Tables to Schema                                                                                                                         
                                                                                                                                                          
 File: /drizzle/schema.ts                                                                                                                                 
                                                                                                                                                          
 Add these tables AFTER your existing users table:                                                                                                        
                                                                                                                                                          
 // Auth.js account table (OAuth provider linkage)                                                                                                        
 export const accounts = mysqlTable("accounts", {                                                                                                         
   id: char("id", { length: 36 }).primaryKey(),                                                                                                           
   userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),                                                                   
   type: varchar("type", { length: 50 }).notNull(),                                                                                                       
   provider: varchar("provider", { length: 50 }).notNull(),                                                                                               
   providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),                                                                            
   refresh_token: text("refresh_token"),                                                                                                                  
   access_token: text("access_token"),                                                                                                                    
   expires_at: int("expires_at"),                                                                                                                         
   token_type: varchar("token_type", { length: 50 }),                                                                                                     
   scope: varchar("scope", { length: 255 }),                                                                                                              
   id_token: text("id_token"),                                                                                                                            
   session_state: varchar("session_state", { length: 255 }),                                                                                              
   createdAt: timestamp("createdAt").defaultNow().notNull(),                                                                                              
   updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),                                                                                
 });                                                                                                                                                      
                                                                                                                                                          
 export type Account = typeof accounts.$inferSelect;                                                                                                      
                                                                                                                                                          
 // Auth.js sessions table (JWT tracking)                                                                                                                 
 export const sessions = mysqlTable("sessions", {                                                                                                         
   id: char("id", { length: 36 }).primaryKey(),                                                                                                           
   userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),                                                                   
   expires: timestamp("expires").notNull(),                                                                                                               
   sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),                                                                             
   createdAt: timestamp("createdAt").defaultNow().notNull(),                                                                                              
   updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),                                                                                
 });                                                                                                                                                      
                                                                                                                                                          
 export type Session = typeof sessions.$inferSelect;                                                                                                      
                                                                                                                                                          
 2.2 Modify Users Table                                                                                                                                   
                                                                                                                                                          
 File: /drizzle/schema.ts                                                                                                                                 
                                                                                                                                                          
 Update the existing users table definition:                                                                                                              
                                                                                                                                                          
 export const users = mysqlTable("users", {                                                                                                               
   id: int("id").autoincrement().primaryKey(),                                                                                                            
                                                                                                                                                          
   // NEW: Add UUID for Auth.js compatibility                                                                                                             
   uuid: char("uuid", { length: 36 }).unique(),                                                                                                           
                                                                                                                                                          
   openId: varchar("openId", { length: 64 }), // Keep for migration                                                                                       
   name: text("name"),                                                                                                                                    
   email: varchar("email", { length: 320 }),                                                                                                              
   role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),                                                                                  
                                                                                                                                                          
   // NEW: Auth.js standard fields                                                                                                                        
   emailVerified: timestamp("emailVerified"),                                                                                                             
   image: text("image"), // Rename from avatarUrl                                                                                                         
                                                                                                                                                          
   avatarUrl: text("avatarUrl"), // Keep for migration period                                                                                             
                                                                                                                                                          
   // Keep all existing business logic fields                                                                                                             
   avatarType: mysqlEnum("avatarType", ["initials", "boring", "upload"]).default("initials"),                                                             
   companyName: text("companyName"),                                                                                                                      
   baseCurrency: varchar("baseCurrency", { length: 3 }).default("USD").notNull(),                                                                         
   logoUrl: text("logoUrl"),                                                                                                                              
   taxId: varchar("taxId", { length: 50 }),                                                                                                               
   defaultInvoiceStyle: mysqlEnum("defaultInvoiceStyle", ["receipt", "classic"]).default("receipt"),                                                      
   stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),                                                                                        
   subscriptionStatus: mysqlEnum("subscriptionStatus", ["free", "active", "canceled", "past_due"]).default("free").notNull(),                             
   subscriptionId: varchar("subscriptionId", { length: 255 }),                                                                                            
   currentPeriodEnd: timestamp("currentPeriodEnd"),                                                                                                       
   subscriptionEndDate: timestamp("subscriptionEndDate"),                                                                                                 
   subscriptionSource: mysqlEnum("subscriptionSource", ["stripe", "crypto"]),                                                                             
   createdAt: timestamp("createdAt").defaultNow().notNull(),                                                                                              
   updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),                                                                                
   lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),                                                                                        
 });                                                                                                                                                      
                                                                                                                                                          
 2.3 Create Migration Script                                                                                                                              
                                                                                                                                                          
 File: /drizzle/migrations/0001_authjs_migration.sql                                                                                                      
                                                                                                                                                          
 -- Add Auth.js columns to users table                                                                                                                    
 ALTER TABLE users                                                                                                                                        
 ADD COLUMN uuid CHAR(36) UNIQUE AFTER id,                                                                                                                
 ADD COLUMN emailVerified TIMESTAMP NULL AFTER email,                                                                                                     
 ADD COLUMN image TEXT NULL AFTER avatarUrl;                                                                                                              
                                                                                                                                                          
 -- Add index on uuid                                                                                                                                     
 CREATE INDEX idx_users_uuid ON users(uuid);                                                                                                              
                                                                                                                                                          
 -- Create accounts table                                                                                                                                 
 CREATE TABLE accounts (                                                                                                                                  
   id CHAR(36) PRIMARY KEY,                                                                                                                               
   userId INT NOT NULL,                                                                                                                                   
   type VARCHAR(50) NOT NULL,                                                                                                                             
   provider VARCHAR(50) NOT NULL,                                                                                                                         
   providerAccountId VARCHAR(255) NOT NULL,                                                                                                               
   refresh_token TEXT,                                                                                                                                    
   access_token TEXT,                                                                                                                                     
   expires_at INT,                                                                                                                                        
   token_type VARCHAR(50),                                                                                                                                
   scope VARCHAR(255),                                                                                                                                    
   id_token TEXT,                                                                                                                                         
   session_state VARCHAR(255),                                                                                                                            
   createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,                                                                                                
   updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,                                                                    
   FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,                                                                                           
   UNIQUE KEY unique_provider_account (provider, providerAccountId)                                                                                       
 );                                                                                                                                                       
                                                                                                                                                          
 -- Create sessions table                                                                                                                                 
 CREATE TABLE sessions (                                                                                                                                  
   id CHAR(36) PRIMARY KEY,                                                                                                                               
   userId INT NOT NULL,                                                                                                                                   
   expires TIMESTAMP NOT NULL,                                                                                                                            
   sessionToken VARCHAR(255) NOT NULL UNIQUE,                                                                                                             
   createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,                                                                                                
   updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,                                                                    
   FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE                                                                                            
 );                                                                                                                                                       
                                                                                                                                                          
 -- Migrate avatarUrl to image                                                                                                                            
 UPDATE users SET image = avatarUrl WHERE avatarUrl IS NOT NULL;                                                                                          
                                                                                                                                                          
 2.4 Apply Schema Changes                                                                                                                                 
                                                                                                                                                          
 pnpm db:push                                                                                                                                             
                                                                                                                                                          
 2.5 Generate UUIDs for Existing Users                                                                                                                    
                                                                                                                                                          
 File: /scripts/migrate-user-ids.ts                                                                                                                       
                                                                                                                                                          
 import { getDb } from "../server/db/connection";                                                                                                         
 import { users } from "../drizzle/schema";                                                                                                               
 import { nanoid } from "nanoid";                                                                                                                         
 import { eq, isNull } from "drizzle-orm";                                                                                                                
                                                                                                                                                          
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
     await db                                                                                                                                             
       .update(users)                                                                                                                                     
       .set({ uuid })                                                                                                                                     
       .where(eq(users.id, user.id));                                                                                                                     
     console.log(`User ${user.id} (${user.email}) → ${uuid}`);                                                                                            
   }                                                                                                                                                      
                                                                                                                                                          
   console.log("✅ Migration complete!");                                                                                                                 
   process.exit(0);                                                                                                                                       
 }                                                                                                                                                        
                                                                                                                                                          
 migrateUserIds().catch(console.error);                                                                                                                   
                                                                                                                                                          
 Run migration:                                                                                                                                           
 NODE_ENV=development tsx scripts/migrate-user-ids.ts                                                                                                     
                                                                                                                                                          
 ---                                                                                                                                                      
 Phase 3: Auth.js Integration (Day 2-3, 8 hours)                                                                                                          
                                                                                                                                                          
 3.1 Install Dependencies                                                                                                                                 
                                                                                                                                                          
 pnpm add @auth/core@beta @auth/drizzle-adapter@beta                                                                                                      
 pnpm add arctic  # OAuth 2.0 client                                                                                                                      
                                                                                                                                                          
 3.2 Create Auth.js Configuration                                                                                                                         
                                                                                                                                                          
 File: /server/_core/auth.ts (NEW FILE)                                                                                                                   
                                                                                                                                                          
 import { Auth } from "@auth/core";                                                                                                                       
 import { DrizzleAdapter } from "@auth/drizzle-adapter";                                                                                                  
 import Google from "@auth/core/providers/google";                                                                                                        
 import GitHub from "@auth/core/providers/github";                                                                                                        
 import { getDb } from "../db/connection";                                                                                                                
 import { users, accounts, sessions } from "../../drizzle/schema";                                                                                        
                                                                                                                                                          
 export const authConfig = {                                                                                                                              
   adapter: DrizzleAdapter(await getDb(), {                                                                                                               
     usersTable: users,                                                                                                                                   
     accountsTable: accounts,                                                                                                                             
     sessionsTable: sessions,                                                                                                                             
   }),                                                                                                                                                    
   providers: [                                                                                                                                           
     Google({                                                                                                                                             
       clientId: process.env.AUTH_GOOGLE_ID!,                                                                                                             
       clientSecret: process.env.AUTH_GOOGLE_SECRET!,                                                                                                     
     }),                                                                                                                                                  
     GitHub({                                                                                                                                             
       clientId: process.env.AUTH_GITHUB_ID!,                                                                                                             
       clientSecret: process.env.AUTH_GITHUB_SECRET!,                                                                                                     
     }),                                                                                                                                                  
   ],                                                                                                                                                     
   secret: process.env.AUTH_SECRET!,                                                                                                                      
   session: {                                                                                                                                             
     strategy: "jwt",                                                                                                                                     
     maxAge: 365 * 24 * 60 * 60, // 1 year                                                                                                                
   },                                                                                                                                                     
   pages: {                                                                                                                                               
     signIn: "/login",                                                                                                                                    
     error: "/login",                                                                                                                                     
   },                                                                                                                                                     
   callbacks: {                                                                                                                                           
     async session({ session, token }) {                                                                                                                  
       if (session.user) {                                                                                                                                
         session.user.id = token.sub!;                                                                                                                    
       }                                                                                                                                                  
       return session;                                                                                                                                    
     },                                                                                                                                                   
     async jwt({ token, user, account }) {                                                                                                                
       if (user) {                                                                                                                                        
         token.sub = user.id.toString();                                                                                                                  
         token.provider = account?.provider;                                                                                                              
       }                                                                                                                                                  
       return token;                                                                                                                                      
     },                                                                                                                                                   
   },                                                                                                                                                     
 };                                                                                                                                                       
                                                                                                                                                          
 export async function authHandler(request: Request) {                                                                                                    
   return Auth(request, authConfig);                                                                                                                      
 }                                                                                                                                                        
                                                                                                                                                          
 3.3 Create Auth Routes                                                                                                                                   
                                                                                                                                                          
 File: /server/_core/auth-routes.ts (NEW FILE)                                                                                                            
                                                                                                                                                          
 import type { Express } from "express";                                                                                                                  
 import { authHandler } from "./auth";                                                                                                                    
                                                                                                                                                          
 export function registerAuthRoutes(app: Express) {                                                                                                       
   app.all("/api/auth/*", async (req, res) => {                                                                                                           
     const url = new URL(req.url, `http://${req.headers.host}`);                                                                                          
     const request = new Request(url, {                                                                                                                   
       method: req.method,                                                                                                                                
       headers: req.headers as HeadersInit,                                                                                                               
       body: req.method === "POST" ? JSON.stringify(req.body) : undefined,                                                                                
     });                                                                                                                                                  
                                                                                                                                                          
     const response = await authHandler(request);                                                                                                         
                                                                                                                                                          
     res.status(response.status);                                                                                                                         
     response.headers.forEach((value, key) => {                                                                                                           
       res.setHeader(key, value);                                                                                                                         
     });                                                                                                                                                  
                                                                                                                                                          
     const body = await response.text();                                                                                                                  
     res.send(body);                                                                                                                                      
   });                                                                                                                                                    
 }                                                                                                                                                        
                                                                                                                                                          
 3.4 Update Context Creation                                                                                                                              
                                                                                                                                                          
 File: /server/_core/context.ts                                                                                                                           
                                                                                                                                                          
 COMPLETE REPLACE:                                                                                                                                        
                                                                                                                                                          
 import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";                                                                        
 import type { User } from "../../drizzle/schema";                                                                                                        
 import { getSession } from "@auth/core";                                                                                                                 
 import { authConfig } from "./auth";                                                                                                                     
                                                                                                                                                          
 export type TrpcContext = {                                                                                                                              
   req: CreateExpressContextOptions["req"];                                                                                                               
   res: CreateExpressContextOptions["res"];                                                                                                               
   user: User | null;                                                                                                                                     
 };                                                                                                                                                       
                                                                                                                                                          
 export async function createContext(                                                                                                                     
   opts: CreateExpressContextOptions                                                                                                                      
 ): Promise<TrpcContext> {                                                                                                                                
   let user: User | null = null;                                                                                                                          
                                                                                                                                                          
   // SKIP_AUTH bypass (KEEP THIS!)                                                                                                                       
   if (process.env.SKIP_AUTH === "true") {                                                                                                                
     if (process.env.NODE_ENV === "production") {                                                                                                         
       throw new Error(                                                                                                                                   
         "CRITICAL SECURITY ERROR: SKIP_AUTH is enabled in production"                                                                                    
       );                                                                                                                                                 
     }                                                                                                                                                    
                                                                                                                                                          
     const { getUserByOpenId, upsertUser } = await import("../db");                                                                                       
                                                                                                                                                          
     let devUser = await getUserByOpenId("dev-user-local");                                                                                               
                                                                                                                                                          
     if (!devUser) {                                                                                                                                      
       await upsertUser({                                                                                                                                 
         openId: "dev-user-local",                                                                                                                        
         name: "Local Dev User",                                                                                                                          
         email: "dev@localhost.test",                                                                                                                     
         loginMethod: "dev",                                                                                                                              
         lastSignedIn: new Date(),                                                                                                                        
       });                                                                                                                                                
       devUser = await getUserByOpenId("dev-user-local");                                                                                                 
     }                                                                                                                                                    
                                                                                                                                                          
     return { req: opts.req, res: opts.res, user: devUser || null };                                                                                      
   }                                                                                                                                                      
                                                                                                                                                          
   // Auth.js session validation                                                                                                                          
   try {                                                                                                                                                  
     const url = new URL(opts.url || "", `http://${opts.headers.host}`);                                                                                  
     const request = new Request(url, {                                                                                                                   
       headers: opts.headers as HeadersInit,                                                                                                              
     });                                                                                                                                                  
                                                                                                                                                          
     const session = await getSession(request, authConfig);                                                                                               
                                                                                                                                                          
     if (session?.user?.id) {                                                                                                                             
       const userId = parseInt(session.user.id);                                                                                                          
       const { getUserById } = await import("../db");                                                                                                     
       user = await getUserById(userId);                                                                                                                  
     }                                                                                                                                                    
   } catch (error) {                                                                                                                                      
     console.warn("[Auth] Session validation failed:", error);                                                                                            
     user = null;                                                                                                                                         
   }                                                                                                                                                      
                                                                                                                                                          
   return {                                                                                                                                               
     req: opts.req,                                                                                                                                       
     res: opts.res,                                                                                                                                       
     user,                                                                                                                                                
   };                                                                                                                                                     
 }                                                                                                                                                        
                                                                                                                                                          
 3.5 Update Server Entry Point                                                                                                                            
                                                                                                                                                          
 File: /server/_core/index.ts                                                                                                                             
                                                                                                                                                          
 FIND:                                                                                                                                                    
 import { registerOAuthRoutes } from "./oauth";                                                                                                           
                                                                                                                                                          
 REPLACE WITH:                                                                                                                                            
 import { registerAuthRoutes } from "./auth-routes";                                                                                                      
                                                                                                                                                          
 FIND:                                                                                                                                                    
 registerOAuthRoutes(app);                                                                                                                                
                                                                                                                                                          
 REPLACE WITH:                                                                                                                                            
 registerAuthRoutes(app);                                                                                                                                 
                                                                                                                                                          
 3.6 Delete Old Files                                                                                                                                     
                                                                                                                                                          
 DELETE:                                                                                                                                                  
 - /server/_core/sdk.ts                                                                                                                                   
 - /server/_core/oauth.ts                                                                                                                                 
                                                                                                                                                          
 ---                                                                                                                                                      
 Phase 4: Environment Variables (Day 3, 1 hour)                                                                                                           
                                                                                                                                                          
 4.1 Update .env.local                                                                                                                                    
                                                                                                                                                          
 # Keep existing DATABASE_URL                                                                                                                             
 DATABASE_URL=mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev                                                                          
                                                                                                                                                          
 # NEW: Auth.js configuration                                                                                                                             
 AUTH_SECRET=your-super-secret-jwt-key-min-32-chars-generate-with-openssl-rand-base64-32                                                                  
 AUTH_GOOGLE_ID=your-google-client-id                                                                                                                     
 AUTH_GOOGLE_SECRET=your-google-client-secret                                                                                                             
 AUTH_GITHUB_ID=your-github-client-id                                                                                                                     
 AUTH_GITHUB_SECRET=your-github-client-secret                                                                                                             
                                                                                                                                                          
 # Keep SKIP_AUTH                                                                                                                                         
 SKIP_AUTH=true                                                                                                                                           
                                                                                                                                                          
 # Keep all existing variables (Stripe, Resend, etc.)                                                                                                     
                                                                                                                                                          
 4.2 Generate AUTH_SECRET                                                                                                                                 
                                                                                                                                                          
 openssl rand -base64 32                                                                                                                                  
                                                                                                                                                          
 ---                                                                                                                                                      
 Phase 5: PlanetScale Setup (Day 3-4, 3 hours)                                                                                                            
                                                                                                                                                          
 5.1 Create PlanetScale Database                                                                                                                          
                                                                                                                                                          
 1. Go to https://planetscale.com and sign up                                                                                                             
 2. Create new database: sleekinvoices-prod                                                                                                               
 3. Select region (US East recommended)                                                                                                                   
 4. Enable "Safe Migrations" ⚠️ CRITICAL                                                                                                                  
 5. Get connection string from dashboard                                                                                                                  
                                                                                                                                                          
 5.2 Update Environment Variables for Production                                                                                                          
                                                                                                                                                          
 File: .env.production (NEW FILE)                                                                                                                         
                                                                                                                                                          
 # PlanetScale connection                                                                                                                                 
 DATABASE_URL=mysql://xxx:pscale_pw_xxx@aws.connect.psdb.cloud/sleekinvoices-prod?ssl={"rejectUnauthorized":true}                                         
                                                                                                                                                          
 # Auth.js                                                                                                                                                
 AUTH_SECRET=${AUTH_SECRET}                                                                                                                               
 AUTH_GOOGLE_ID=${AUTH_GOOGLE_ID}                                                                                                                         
 AUTH_GOOGLE_SECRET=${AUTH_GOOGLE_SECRET}                                                                                                                 
 AUTH_GITHUB_ID=${AUTH_GITHUB_ID}                                                                                                                         
 AUTH_GITHUB_SECRET=${AUTH_GITHUB_SECRET}                                                                                                                 
                                                                                                                                                          
 # NO SKIP_AUTH IN PRODUCTION!                                                                                                                            
 # SKIP_AUTH=true  <-- DELETE THIS                                                                                                                        
                                                                                                                                                          
 # Keep all existing vars                                                                                                                                 
 STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}                                                                                                                   
 STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}                                                                                                           
 RESEND_API_KEY=${RESEND_API_KEY}                                                                                                                         
 OPENROUTER_API_KEY=${OPENROUTER_API_KEY}                                                                                                                 
 S3_BUCKET=${S3_BUCKET}                                                                                                                                   
 S3_REGION=${S3_REGION}                                                                                                                                   
 S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}                                                                                                                     
 S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY}                                                                                                             
                                                                                                                                                          
 5.3 Push Schema to PlanetScale                                                                                                                           
                                                                                                                                                          
 # Temporarily override DATABASE_URL                                                                                                                      
 DATABASE_URL="mysql://xxx@aws.connect.psdb.cloud/sleekinvoices-prod?ssl={...}" pnpm db:push                                                              
                                                                                                                                                          
 5.4 Migrate Data to PlanetScale                                                                                                                          
                                                                                                                                                          
 # Export from local MySQL                                                                                                                                
 mysqldump -u root -p sleekinvoices_dev --no-create-info --skip-triggers --single-transaction > data_dump.sql                                             
                                                                                                                                                          
 # Import to PlanetScale                                                                                                                                  
 pscale import sleekinvoices-prod main data_dump.sql                                                                                                      
                                                                                                                                                          
 ---                                                                                                                                                      
 Phase 6: Vercel Deployment (Day 4-5, 4 hours)                                                                                                            
                                                                                                                                                          
 6.1 Install Vercel CLI                                                                                                                                   
                                                                                                                                                          
 pnpm add -D vercel                                                                                                                                       
                                                                                                                                                          
 6.2 Create Vercel Config                                                                                                                                 
                                                                                                                                                          
 File: /vercel.json (NEW FILE)                                                                                                                            
                                                                                                                                                          
 {                                                                                                                                                        
   "version": 2,                                                                                                                                          
   "buildCommand": "pnpm vercel-build",                                                                                                                   
   "devCommand": "pnpm dev",                                                                                                                              
   "installCommand": "pnpm install",                                                                                                                      
   "framework": null,                                                                                                                                     
   "functions": {                                                                                                                                         
     "api/**/*.js": {                                                                                                                                     
       "memory": 1024,                                                                                                                                    
       "maxDuration": 30                                                                                                                                  
     },                                                                                                                                                   
     "api/**/*.ts": {                                                                                                                                     
       "memory": 1024,                                                                                                                                    
       "maxDuration": 30                                                                                                                                  
     }                                                                                                                                                    
   },                                                                                                                                                     
   "routes": [                                                                                                                                            
     {                                                                                                                                                    
       "src": "/api/(.*)",                                                                                                                                
       "dest": "/server/_core/index.ts"                                                                                                                   
     },                                                                                                                                                   
     {                                                                                                                                                    
       "src": "/(.*\\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot))",                                                                             
       "dest": "/dist/public/$1"                                                                                                                          
     },                                                                                                                                                   
     {                                                                                                                                                    
       "src": "/(.*)",                                                                                                                                    
       "dest": "/dist/public/index.html"                                                                                                                  
     }                                                                                                                                                    
   ]                                                                                                                                                      
 }                                                                                                                                                        
                                                                                                                                                          
 6.3 Update Build Script                                                                                                                                  
                                                                                                                                                          
 File: /package.json                                                                                                                                      
                                                                                                                                                          
 ADD to scripts:                                                                                                                                          
 "vercel-build": "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"                    
                                                                                                                                                          
 6.4 Deploy to Vercel                                                                                                                                     
                                                                                                                                                          
 # Link project                                                                                                                                           
 npx vercel link                                                                                                                                          
                                                                                                                                                          
 # Set environment variables in Vercel dashboard or CLI:                                                                                                  
 npx vercel env add DATABASE_URL production                                                                                                               
 npx vercel env add AUTH_SECRET production                                                                                                                
 npx vercel env add AUTH_GOOGLE_ID production                                                                                                             
 npx vercel env add AUTH_GOOGLE_SECRET production                                                                                                         
 npx vercel env add AUTH_GITHUB_ID production                                                                                                             
 npx vercel env add AUTH_GITHUB_SECRET production                                                                                                         
 # ... add all other env vars                                                                                                                             
                                                                                                                                                          
 # Deploy to preview                                                                                                                                      
 npx vercel                                                                                                                                               
                                                                                                                                                          
 # Test preview URL thoroughly                                                                                                                            
 # Test login, create invoice, send email, etc.                                                                                                           
                                                                                                                                                          
 # Deploy to production                                                                                                                                   
 npx vercel --prod                                                                                                                                        
                                                                                                                                                          
 ---                                                                                                                                                      
 Phase 7: Testing & Validation (Day 5-7, Ongoing)                                                                                                         
                                                                                                                                                          
 7.1 Pre-Launch Checklist                                                                                                                                 
                                                                                                                                                          
 Authentication:                                                                                                                                          
 - Google OAuth login works                                                                                                                               
 - GitHub OAuth login works                                                                                                                               
 - Existing users can log in                                                                                                                              
 - Session persists across page reloads                                                                                                                   
 - Logout works correctly                                                                                                                                 
 - SKIP_AUTH still works in dev mode                                                                                                                      
                                                                                                                                                          
 Business Logic:                                                                                                                                          
 - Can create invoice                                                                                                                                     
 - Can send invoice via email                                                                                                                             
 - Stripe payment flow works                                                                                                                              
 - AI features work                                                                                                                                       
 - PDF generation works                                                                                                                                   
 - All 43 tables have data                                                                                                                                
                                                                                                                                                          
 Data Integrity:                                                                                                                                          
 # Verify data counts match                                                                                                                               
 mysql -h aws.connect.psdb.cloud -u xxx -p sleekinvoices-prod -e "SELECT COUNT(*) FROM users;"                                                            
 mysql -h aws.connect.psdb.cloud -u xxx -p sleekinvoices-prod -e "SELECT COUNT(*) FROM invoices;"                                                         
                                                                                                                                                          
 7.2 Performance Testing                                                                                                                                  
                                                                                                                                                          
 # Test auth endpoints                                                                                                                                    
 npx autocannon -c 10 -d 30 https://your-app.com/api/auth/signin                                                                                          
                                                                                                                                                          
 # Test session validation                                                                                                                                
 npx autocannon -c 100 -d 30 https://your-app.com/api/trpc/auth.me                                                                                        
                                                                                                                                                          
 Target metrics:                                                                                                                                          
 - Login success rate: >99%                                                                                                                               
 - Session validation latency: <50ms                                                                                                                      
 - Database query latency: <100ms                                                                                                                         
 - Page load time: <2s                                                                                                                                    
                                                                                                                                                          
 ---                                                                                                                                                      
 Critical Files Summary                                                                                                                                   
                                                                                                                                                          
 Files to MODIFY                                                                                                                                          
                                                                                                                                                          
 1. /drizzle/schema.ts - Add Auth.js tables (accounts, sessions), add UUID column to users                                                                
 2. /server/_core/context.ts - Replace Manus SDK with Auth.js session validation                                                                          
 3. /server/_core/index.ts - Replace OAuth routes with Auth.js routes                                                                                     
 4. /package.json - Add Auth.js dependencies and vercel-build script                                                                                      
 5. .env.local - Add Auth.js environment variables                                                                                                        
                                                                                                                                                          
 Files to CREATE                                                                                                                                          
                                                                                                                                                          
 6. /server/_core/auth.ts - Auth.js configuration                                                                                                         
 7. /server/_core/auth-routes.ts - Express wrapper for Auth.js                                                                                            
 8. /vercel.json - Vercel deployment config                                                                                                               
 9. /scripts/migrate-user-ids.ts - UUID migration script                                                                                                  
 10. /.env.production - Production environment variables template                                                                                         
                                                                                                                                                          
 Files to DELETE                                                                                                                                          
                                                                                                                                                          
 11. /server/_core/sdk.ts - Old Manus OAuth SDK                                                                                                           
 12. /server/_core/oauth.ts - Old OAuth callback handler                                                                                                  
                                                                                                                                                          
 ---                                                                                                                                                      
 Risk Mitigation                                                                                                                                          
                                                                                                                                                          
 High-Risk Areas                                                                                                                                          
                                                                                                                                                          
 1. User data loss during migration                                                                                                                       
   - Mitigation: Triple backup (local + cloud + PlanetScale)                                                                                              
   - Validation: Run verification script before cutover                                                                                                   
   - Rollback: Pre-tested restore procedure                                                                                                               
 2. OAuth provider misconfiguration                                                                                                                       
   - Mitigation: Test on preview environment first                                                                                                        
   - Validation: Manual login testing with both providers                                                                                                 
   - Fallback: Keep old auth running during transition                                                                                                    
 3. Downtime during deployment                                                                                                                            
   - Mitigation: Deploy during low-traffic hours (2-4 AM)                                                                                                 
   - Communication: Notify users in advance                                                                                                               
   - Validation: Health check endpoint monitoring                                                                                                         
                                                                                                                                                          
 Rollback Plan                                                                                                                                            
                                                                                                                                                          
 If migration fails:                                                                                                                                      
                                                                                                                                                          
 1. Revert DNS to old server (5-30 min propagation)                                                                                                       
 2. Verify old server is running: pm2 status or systemctl status sleekinvoices                                                                            
 3. Restore database from backup: mysql -u root -p sleekinvoices_prod < backup_20250120.sql                                                               
 4. Investigate logs: npx vercel logs --prod > failed-migration.txt                                                                                       
 5. Fix issue and retry                                                                                                                                   
                                                                                                                                                          
 ---                                                                                                                                                      
 Success Criteria                                                                                                                                         
                                                                                                                                                          
 Migration is complete when:                                                                                                                              
                                                                                                                                                          
 - All users can log in with Google or GitHub                                                                                                             
 - All 43 database tables exist in PlanetScale                                                                                                            
 - Zero data loss (user counts match before/after)                                                                                                        
 - Application is live on Vercel with custom domain                                                                                                       
 - All tRPC endpoints return correct data                                                                                                                 
 - SKIP_AUTH still works for local development                                                                                                            
 - Error rate <1% for authentication requests                                                                                                             
 - Page load time <2s on Vercel                                                                                                                           
 - Database query latency <100ms on PlanetScale                                                                                                           
                                                                                                                                                          
 ---                                                                                                                                                      
 Timeline Estimate                                                                                                                                        
                                                                                                                                                          
 | Phase | Task                      | Duration         |                                                                                                 
 |-------|---------------------------|------------------|                                                                                                 
 | 1     | Preparation & OAuth setup | 4 hours          |                                                                                                 
 | 2     | Database schema changes   | 6 hours          |                                                                                                 
 | 3     | Auth.js integration       | 8 hours          |                                                                                                 
 | 4     | Environment variables     | 1 hour           |                                                                                                 
 | 5     | PlanetScale setup         | 3 hours          |                                                                                                 
 | 6     | Vercel deployment         | 4 hours          |                                                                                                 
 | 7     | Testing & validation      | Ongoing (3 days) |                                                                                                 
                                                                                                                                                          
 Total: ~26 hours development + 3 days monitoring                                                                                                         
                                                                                                                                                          
 ---                                                                                                                                                      
 Next Steps                                                                                                                                               
                                                                                                                                                          
 1. Review this plan and adjust for your specific needs                                                                                                   
 2. Set up Google + GitHub OAuth apps                                                                                                                     
 3. Create PlanetScale account                                                                                                                            
 4. Start with Phase 1 (preparation)                                                                                                                      
 5. Execute phases sequentially                                                                                                                           
 6. Test thoroughly at each step                                                                                                                          
 7. Deploy to production when all tests pass                                              