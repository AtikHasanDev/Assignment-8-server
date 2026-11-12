import { readConfig } from "./config.js";
import { connectDatabase } from "./db.js";
import { createApp } from "./app.js";
import { createTokenVerifier, requireAuth, requireStudioAuth } from "./auth.js";
import { bookReads } from "./book-reads.js";
import { bookWrites } from "./book-writes.js";
import { borrowRoutes } from "./borrows.js";
import { studioReads } from "./studio-reads.js";
import { studioWrites } from "./studio-writes.js";
import { bookingRoutes } from "./bookings.js";
export async function createRuntime(config = readConfig()) {
  const { client, db } = await connectDatabase(config);
  const verify = createTokenVerifier(config);
  const context = {
    config,
    client,
    db,
    auth: requireAuth(verify),
  };
  const studioContext = { ...context, auth: requireStudioAuth(verify) };
  const app = createApp({
    config,
    routes: [
      bookReads(context),
      bookWrites(context),
      borrowRoutes(context),
      studioReads(studioContext),
      studioWrites(studioContext),
      bookingRoutes(studioContext),
    ],
  });

  return { app, client, config };
}
