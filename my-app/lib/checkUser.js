import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  // Gracefully handle Clerk not being initialized in Middleware or unauthenticated browser
  let user = null;
  try {
    user = await currentUser();
  } catch (err) {
    console.error("checkUser: failed to resolve currentUser()", err?.message);
    return null; // Don't break rendering if Clerk isn't ready
  }

  if (!user) return null;

  try {
    const loggedInUser = await db.user.findUnique({
      where: { clerkUserId: user.id },
    });
    if (loggedInUser) return loggedInUser;

    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined;
    const email = user.emailAddresses?.[0]?.emailAddress;

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl ?? undefined,
        email,
      },
    });
    return newUser;
  } catch (error) {
    console.error("checkUser: DB error", error?.message);
    return null; // Avoid throwing in server components
  }
};