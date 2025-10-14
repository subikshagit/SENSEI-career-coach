import { PrismaClient } from "@prisma/client";


export const db = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "production" ? [] : ["error", "warn"],
});

if (process.env.NODE_ENV !== "production"){
  globalThis.prisma = db;
}

 