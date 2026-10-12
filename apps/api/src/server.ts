import { OAuth2Client } from "google-auth-library";
import { buildApp, type AppOptions } from "./app";
import { createDb, migrate } from "./db";

const db = await createDb();
await migrate(db);

const googleClientIds = (process.env.GOOGLE_CLIENT_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
let verifyGoogle: AppOptions["verifyGoogle"];
if (googleClientIds.length > 0) {
  const client = new OAuth2Client();
  verifyGoogle = async (idToken) => {
    const ticket = await client.verifyIdToken({ idToken, audience: googleClientIds });
    const payload = ticket.getPayload();
    if (!payload?.sub) throw new Error("no sub");
    return { sub: payload.sub, name: payload.name };
  };
}

const app = await buildApp({
  db,
  verifyGoogle,
  corsOrigins: (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  logger: true,
});

const port = Number(process.env.PORT ?? 8787);
await app.listen({ port, host: "0.0.0.0" });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await app.close();
    await db.close();
    process.exit(0);
  });
}
