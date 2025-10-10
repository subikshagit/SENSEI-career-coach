import { NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1;`; // simple DB ping
    return NextResponse.json({ message: "Database pinged successfully ✅" });
  } catch (error) {
    return NextResponse.json(
      { message: "Ping failed ❌", error: error.message },
      { status: 500 }
    );
  }
}
